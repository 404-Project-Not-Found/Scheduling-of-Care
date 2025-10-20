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
  {params}: {params: {clientId: string; categoryId: string}}
){
  await connectDB();

  let clientId: Types.ObjectId;
  let categoryId: Types.ObjectId;
  try {
    clientId = new Types.ObjectId(params.clientId);
    categoryId = new Types.ObjectId(params.categoryId);
  } catch {
    return NextResponse.json({error: 'Invalid id'}, {status: 422});
  }

  const url = new URL(req.url);
  const yearParam = url.searchParams.get('year');
  const year = Number.isFinite(Number(yearParam)) ? Number(yearParam) : new Date().getFullYear();

  const budget = await BudgetYear.findOne({clientId, year}).lean();
  const budgetCat = budget?.categories.find((c) => String(c.categoryId) === String(categoryId));

  const nameCat = (budgetCat?.categoryName ?? 'Category').trim() || 'Category';
  const allocatedCat = Math.round(budgetCat?.allocated ?? 0);

  const itemAgg = await Transaction.aggregate<ItemSpentRow>([
    {$match: {clientId, year, voicedAt: {$exists: false}}},
    {$unwind: '$lines'},
    {$match: {'lines.categoryid': categoryId}},
    {
      $group: {
        _id: 'lines.careItemSlug',
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

  const spentBySlug = new Map<string, {spent: number; label?: string}>(
    itemAgg.map((r) => [r._id, {spent: Number(r.spent ?? 0), label: r.label}])
  );

  const items: CategoryItem[] = [];

  for (const bi of budgetCat?.items ?? []) {
    const slug = bi.careItemSlug;
    const fromAgg = spentBySlug.get(slug);
    const spent = Math.round(fromAgg?.spent ?? 0);
    const label =
      (bi.label && bi.label.trim()) ||
      (fromAgg?.label && fromAgg.label.trim()) ||
      slug;
    items.push({
      careItemSlug: slug,
      label,
      allocated: Math.round(bi.allocated ?? 0),
      spent,
    });
  }

  for (const [slug, info] of spentBySlug.entries()) {
    const already = items.find((i) => i.careItemSlug === slug);
    if (already) continue;
    const label = (info.label && info.label.trim()) || slug;
    items.push({
      careItemSlug: slug,
      label,
      allocated: 0,
      spent: Math.round(info.spent ?? 0),
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