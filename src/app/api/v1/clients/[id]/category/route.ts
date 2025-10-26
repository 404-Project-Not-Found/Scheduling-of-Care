/**
 * Filename: /app/api/category/route.ts
 * Author: Zahra Rizqita
 * Date Created: 05/10/2025
 * Last updated by Zahra Rizqita to connect client to category on 11/10/2025
 */

import { NextResponse, NextRequest } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Category from '@/models/Category';
import CareItem from '@/models/CareItem';
import { findOrCreateNewCategory } from '@/lib/category-helpers';
import mongoose, { Types } from 'mongoose';
import { slugify } from '@/lib/slug';

export const runtime = 'nodejs';

interface CategoryDeleteBody {
    clientId?: string;
    slug?: string;
    name?: string;
}
function isObjectIdString(s: unknown): s is string {
  return typeof s === 'string' && Types.ObjectId.isValid(s);
}

// Search through categories if clientId is given, return only categories used by that client
export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  await connectDB();

  const { searchParams } = new URL(req.url);
  const q = (searchParams.get('q') || '').trim();
  const { id } = await ctx.params;

  const baseFilter: Record<string, unknown> = {};

  if (q) {
    const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    baseFilter.$or = [
      { name: { $regex: escaped, $options: 'i' } },
      { aliases: { $regex: escaped, $options: 'i' } },
    ];
  }

  if (!id || !Types.ObjectId.isValid(id)) {
    return NextResponse.json(
      { error: 'Invalid client id in path' },
      { status: 400 }
    );
  }
  const clientId = new Types.ObjectId(id);

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


// Delete a category
export async function DELETE(req: Request) {
  await connectDB();

  let body: CategoryDeleteBody;
  try {
    body = (await req.json()) as CategoryDeleteBody;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const clientIdStr = (body.clientId || '').trim();
  if (!clientIdStr || !Types.ObjectId.isValid(clientIdStr)) {
    return NextResponse.json(
      { error: 'clientId must be a valid ObjectID' },
      { status: 422 }
    );
  }
  const clientId = new Types.ObjectId(clientIdStr);

  const resolvedSlug =
    (body.slug || '').trim() ||
    (body.name ? slugify(body.name.trim()) : '');

  if (!resolvedSlug) {
    return NextResponse.json(
      { error: 'Provide slug or name to delete' },
      { status: 422 }
    );
  }

  const category = await Category.findOne({ clientId, slug: resolvedSlug }).lean();
  if (!category) {
    return NextResponse.json({ error: 'Category not found' }, { status: 404 });
  }

  const session = await mongoose.startSession();
  try {
    let deletedCareItems = 0;
    await session.withTransaction(async () => {
      const careItemFilter = {
        clientId,
        $or: [
          { categoryId: category._id },
          { categorySlug: category.slug },
          { category: category.name }
        ],
      };

      const careRes = await CareItem.deleteMany(careItemFilter, { session });
      deletedCareItems = careRes.deletedCount ?? 0;

      await Category.deleteOne({ _id: category._id, clientId }, { session });
    });

    return NextResponse.json({
      ok: true,
      deletedCategoryId: String(category._id),
      deletedCategorySlug: category.slug,
      deletedCareItems,
    });
  } catch (e) {
    console.error('Cascade delete failed', e);
    return NextResponse.json(
      { error: 'Failed to delete category and its items' },
      { status: 500 }
    );
  } finally {
    session.endSession();
  }
}