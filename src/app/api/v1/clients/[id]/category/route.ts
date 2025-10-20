/**
 * Filename: /app/api/category/route.ts
 * Author: Zahra Rizqita
 * Date Created: 05/10/2025
 * Last updated by Zahra Rizqita to connect client to category on 11/10/2025
 */

import { NextResponse, NextRequest } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Category from '@/models/Category';
import { findOrCreateNewCategory } from '@/lib/category-helpers';
import { Types } from 'mongoose';

export const runtime = 'nodejs';

function isObjectIdString(s: unknown): s is string {
  return typeof s === 'string' && Types.ObjectId.isValid(s);
}

// Search through categories if clientId is given, return only categories used by that client

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  await connectDB();

  const { searchParams } = new URL(req.url);
  const q = (searchParams.get('q') || '').trim();
  const idFromPath = (params?.id || '').trim(); 

  
  const baseFilter: Record<string, unknown> = {};

  if (q) {
    const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    baseFilter.$or = [
      { name: { $regex: escaped, $options: 'i' } },
      { aliases: { $regex: escaped, $options: 'i' } },
    ];
  }

  
  if (!idFromPath || !Types.ObjectId.isValid(idFromPath)) {
    return NextResponse.json({ error: 'Invalid client id in path' }, { status: 400 });
  }
  const clientId = new Types.ObjectId(idFromPath);

  const list = await Category.find({ ...baseFilter, clientId })
    .sort({ name: 1 })
    .limit(200)
    .lean();

  return NextResponse.json(
    list.map((c) => ({
      _id: String(c._id),
      name: c.name,
      slug: c.slug,
      aliases: c.aliases ?? [],
      clientId: String(c.clientId),
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
    }))
  );
}
interface CategoryCreateBody {
  input: string;
  clientId: string;
}

// Create a new category or reuse existing one if have the same name
export async function POST(req: Request) {
  await connectDB();

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const body = raw as Partial<CategoryCreateBody>;
  const input = typeof body.input === 'string' ? body.input.trim() : '';
  const clientIdStr =
    typeof body.clientId === 'string' ? body.clientId.trim() : '';

  if (!input)
    return NextResponse.json(
      { error: 'Category name required' },
      { status: 422 }
    );
  if (!isObjectIdString(clientIdStr))
    return NextResponse.json(
      { error: 'clientId must be a valid ObjectID' },
      { status: 422 }
    );

  const clientId = new Types.ObjectId(clientIdStr);

  try {
    const category = await findOrCreateNewCategory({ clientId, input });
    return NextResponse.json(
      {
        _id: category._id,
        name: category.name,
        slug: category.slug,
        aliases: category.aliases ?? [],
        clientId: category.clientId,
        createdAt: category.createdAt,
        updatedAt: category.updatedAt,
      },
      { status: 201 }
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Failed to create category';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
