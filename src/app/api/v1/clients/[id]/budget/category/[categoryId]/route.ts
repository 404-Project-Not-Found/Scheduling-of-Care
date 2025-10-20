/**
 * Filename: /app/api/v1/clients/[id]/budget/category/[categoryId]/route.ts
 * Author: Zahra Rizqita
 * Date Created: 10/10/2025
 */

import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { BudgetYear } from "@/models/Budget";
import { Types } from 'mongoose';
import { Transaction } from "@/models/Transaction";
import CareItem from '@/models/CareItem'; 
import { slugify } from '@/lib/slug';

type CategoryItem = {
  careItemSlug: string;
  label: string;
  allocated: number;
  spent: number; // purchase - refund
}

type CategoryDetail = {
  categoryName: string;
  allocated: number;
  spent: number; // sum of item
  items: CategoryItem[];
}

type ItemSpentRow = {
  _id: string;
  label?: string;
  spent: number;
}

export async function GET(
  req: Request,
  {params}: {params: Promise<{id: string; categoryId: string}>}
){
  await connectDB();

  const {id, categoryId} = await params

  let clientId: Types.ObjectId;
  let catId: Types.ObjectId;
  try {
    clientId = new Types.ObjectId(id);
    catId = new Types.ObjectId(categoryId);
  } catch {
    return NextResponse.json({error: 'Invalid id'}, {status: 422});
  }

  const url = new URL(req.url);
  const yearParam = url.searchParams.get('year');
  const year = Number.isFinite(Number(yearParam)) ? Number(yearParam) : new Date().getFullYear();

  const budget = await BudgetYear.findOne({clientId, year}).lean();
  const budgetCat = budget?.categories.find((c) => String(c.categoryId) === String(catId));

  const nameCat = (budgetCat?.categoryName ?? 'Category').trim() || 'Category';
  const allocatedCat = Math.round(budgetCat?.allocated ?? 0);

  const spendAgg = await Transaction.aggregate<ItemSpentRow>([
    {$match: {clientId, year, voidedAt: {$exists: false}}},
    {$unwind: '$lines'},
    {$match: {'lines.categoryId': catId}},
    {
      $group: {
        _id: {$toLower: '$lines.careItemSlug'},
        label: {$last: '$lines.label'},
        spent: {
          $sum: {
            $cond: [
                {$eq: ['$type', 'Purchase']},
                '$lines.amount',
                {$multiply: [-1, '$lines.amount']},
            ],
          }, 
        }, 
      },
    },
  ]);

  const spentBySlug = new Map<string, { spent: number; label?: string }>();
  for (const r of spendAgg) {
    const derivedSlug = r._id && r._id.trim()
      ? r._id
      : (r.label ? slugify(r.label).toLowerCase() : '');
    if (!derivedSlug) continue;
    spentBySlug.set(derivedSlug, {
      spent: Math.round(Number(r.spent ?? 0)),
      label: r.label,
    });
  }

  const catalogLabels = await CareItem.distinct('label', {
    clientId,
    categoryId: catId,
    deleted: { $ne: true },
  }) as string[];

  const catalog = (catalogLabels ?? [])
  .map((lbl) => {
    const label = (lbl || '').trim();
    if (!label) return null;
    return { slug: slugify(label).toLowerCase(), label };
  })
  .filter(Boolean) as Array<{ slug: string; label: string }>;

  const unionSlugs = new Set<string>();

  for (const bi of budgetCat?.items ?? []) {
    const s = String(bi.careItemSlug || '').toLowerCase().trim();
    if (s) unionSlugs.add(s);
  }

  for (const s of spentBySlug.keys()) unionSlugs.add(s);

  for (const { slug } of catalog) unionSlugs.add(slug);

  const items: CategoryItem[] = [];
  for (const slug of unionSlugs) {
    const fromBudget = (budgetCat?.items ?? [])
      .find((i) => String(i.careItemSlug).toLowerCase().trim() === slug);
    const fromSpend = spentBySlug.get(slug);
    const fromCatalog = catalog.find((c) => c.slug === slug);

    const label =
      (fromBudget?.label && fromBudget.label.trim()) ||
      (fromSpend?.label && fromSpend.label.trim()) ||
      (fromCatalog?.label && fromCatalog.label.trim()) ||
      slug;

    items.push({
      careItemSlug: slug,
      label,
      allocated: Math.round(fromBudget?.allocated ?? 0),
      spent: Math.round(fromSpend?.spent ?? 0),
    });
  }

  items.sort((a, b) => a.label.localeCompare(b.label));
  const spentCat = items.reduce((s, it) => s + it.spent, 0);

  const result: CategoryDetail = {
    categoryName: nameCat,
    allocated: allocatedCat,
    spent: spentCat,
    items,
  };

  return NextResponse.json(result);
}