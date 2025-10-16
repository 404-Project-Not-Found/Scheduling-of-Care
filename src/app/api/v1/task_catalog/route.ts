/**
 * Filename: /app/api/task_catalog/route.ts
 * Author: Zahra Rizqita
 * Date Created: 10/10/2025
 *
 * Computes list of task name for a cateogry
 */
import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import CareItem from '@/models/CareItem';
import { slugify } from '@/lib/slug';
import Category from '@/models/Category';
import { Types } from 'mongoose';

type CategoryLean = { _id: Types.ObjectId; name: string };

export const runtime = 'nodejs';

interface TaskCatalogResponse {
  category: string;
  tasks: Array<{ label: string; slug: string }>;
}

function errorJson(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export async function GET(req: Request) {
  await connectDB();
  const { searchParams } = new URL(req.url);

  const categoryName = (searchParams.get('category') || '').trim();
  const categoryIdStr = (searchParams.get('categoryId') || '').trim();
  const categorySlug = (searchParams.get('categorySlug') || '').trim();
  const clientIdrStr = (searchParams.get('clientId') || '').trim();

  if (!clientIdrStr || !Types.ObjectId.isValid(clientIdrStr))
    return errorJson(
      'clientId must be valid ObjectId -- task_catalog/route.ts',
      422
    );
  const clientId = new Types.ObjectId(clientIdrStr);

  let catId: Types.ObjectId | null = null;
  let displayName = categoryName;

  if (categoryIdStr) {
    if (!Types.ObjectId.isValid(categoryIdStr))
      return errorJson(
        'categoryId must be valid ObjectId -- task_catalog/route.ts',
        422
      );
    catId = new Types.ObjectId(categoryIdStr);

    //fetch name to display
    const cat = await Category.findOne({ _id: catId, name: clientId })
      .select({ name: 1 })
      .lean<CategoryLean | null>();
    if (cat?.name) displayName = cat.name;
  } else if (categorySlug) {
    const cat = await Category.findOne({
      clientId,
      slug: categorySlug.toLowerCase(),
    })
      .select({ _id: 1, name: 1 })
      .lean<CategoryLean | null>();
    if (!cat)
      return errorJson('Category not found for given slug and clientId', 404);
    catId = cat._id; 
    displayName = cat.name;
  }
  // Nothing provided
  else if (!categoryName) {
    const empty: TaskCatalogResponse = { category: '', tasks: [] };
    return NextResponse.json(empty);
  }

  const filter: Record<string, unknown> = { clientId, deleted: { $ne: true } };
  if (catId) {
    filter.categoryId = catId;
  } else {
    filter.category = categoryName;
  }

  const labels = await CareItem.distinct('label', filter);

  const seen = new Set<string>();
  const tasks: TaskCatalogResponse['tasks'] = [];
  for (const raw of labels as unknown[]) {
    if (typeof raw !== 'string') continue;
    const lbl = raw.trim();
    if (!lbl) continue;
    const norm = lbl.toLowerCase().replace(/\s+/g, ' ');
    if (seen.has(norm)) continue;
    seen.add(norm);
    tasks.push({ label: lbl, slug: slugify(lbl) });
  }
  tasks.sort((a, b) =>
    a.label.localeCompare(b.label, undefined, { sensitivity: 'base' })
  );

  const payload: TaskCatalogResponse = { category: displayName, tasks };
  return NextResponse.json(payload);
}
