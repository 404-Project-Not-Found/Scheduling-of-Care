/**
 * Filename: /app/api/category/route.ts
 * Author: Zahra Rizqita
 * Date Created: 05/10/2025
 */

import {NextResponse} from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Category from '@/models/Category';
import CareItem from '@/models/CareItem';
import { findOrCreateNewCategory } from '@/lib/category-helpers';
import { Types } from 'mongoose';


export const runtime = 'nodejs';

// Search through categories if clientId is given, return only categories used by that client
export async function GET(req: Request) {
  await connectDB();
  const { searchParams } = new URL(req.url);

  const q = (searchParams.get('q') || '').trim();
  const clientIdStr = (searchParams.get('clientId') || '').trim();

  // If clientId is present, scope to that client's categories
  if (clientIdStr) {
    if (!Types.ObjectId.isValid(clientIdStr)) {
      return NextResponse.json(
        { error: 'clientId must be a valid ObjectId' },
        { status: 400 }
      );
    }
    const clientId = new Types.ObjectId(clientIdStr);

    // Pull the categories actually used by this client's non-deleted items
    const raw = await CareItem.find(
      { clientId, deleted: { $ne: true } },
      { categoryId: 1, category: 1 }
    ).lean();

    // Collect categoryIds (preferred) and fallback names (legacy)
    const idSet = new Set<string>();
    const nameSet = new Set<string>();
    for (const r of raw) {
      if (r.categoryId) {
        idSet.add(String(r.categoryId));
      } else if (r.category) {
        nameSet.add(r.category);
      }
    }

    // Fetch by ids
    const idDocs = idSet.size
      ? await Category.find({ _id: { $in: Array.from(idSet, (s) => new Types.ObjectId(s)) } })
          .sort({ name: 1 })
          .lean()
      : [];

    // For legacy items that only had a string category, include matching Category docs by name
    // (If a name isn't found in Category, you can optionally synthesize a minimal entry.)
    const remainingNames = nameSet.size
      ? await Category.find({ name: { $in: Array.from(nameSet) } })
          .sort({ name: 1 })
          .lean()
      : [];

    // Merge and (optionally) apply text filter q
    const merged = [...idDocs, ...remainingNames];
    const filtered = q
      ? merged.filter((c) => {
          const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          const re = new RegExp(escaped, 'i');
          return (
            re.test(c.name ?? '') ||
            (Array.isArray(c.aliases) && c.aliases.some((a: string) => re.test(a)))
          );
        })
      : merged;

    // De-duplicate by _id (in case of overlap)
    const seen = new Set<string>();
    const list = filtered.filter((c) => {
      const id = String(c._id);
      if (seen.has(id)) return false;
      seen.add(id);
      return true;
    });

    return NextResponse.json(
      list.slice(0, 200).map((c) => ({
        name: c.name,
        slug: c.slug,
        aliases: c.aliases ?? [],
        createdAt: c.createdAt,
        updatedAt: c.updatedAt,
      }))
    );
  }

  const filter = q
    ? {
        $or: [
          { name: { $regex: q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' } },
          { aliases: { $regex: q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' } },
        ],
      }
    : {};

  const list = await Category.find(filter).sort({ name: 1 }).limit(200).lean();
  return NextResponse.json(
    list.map((c) => ({
      name: c.name,
      slug: c.slug,
      aliases: c.aliases ?? [],
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
    }))
  );
}


// Create a new category or reuse existing one if have the same name
export async function POST(req: Request) {
    await connectDB();
    let body: unknown;
    try {
        body = await req.json();
    } catch {
        return NextResponse.json({error: 'Invalid JSON'}, {status: 400});
    }

    const input = typeof(body as {name?: unknown}).name === 'string' ? (body as {name: string}).name.trim() : '';
    if(!input) return NextResponse.json({error: 'Category name required'}, {status: 422});

    try{
        const category = await findOrCreateNewCategory(input);
        return NextResponse.json(category, {status: 201});
    } catch (e) {
        const msg = e instanceof Error ? e.message: 'Failed to create category';
        return NextResponse.json({error: msg}, {status: 500});
    }
}