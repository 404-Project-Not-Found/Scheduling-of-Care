/**
 * Filename: /app/api/v1/clients/[id]/budget/manage/route.ts
 * Author: Zahra Rizqita
 * Date Created: 10/10/2025
 *
 * Handle api for budget, get category-level rows for the report
 */
import { NextResponse } from 'next/server';
import { Types } from 'mongoose';
import { connectDB } from '@/lib/mongodb';
import {
  BudgetYear,
  type BudgetYearLean,
  type CategoryBudget,
} from '@/models/Budget';
import { Transaction } from '@/models/Transaction';

type BudgetRow = {
  categoryId: string;
  item: string;
  category: string;
  allocated: number;
  spent: number;
};

interface SpentAggRow {
  _id: Types.ObjectId;
  spent: number;
}

export async function GET(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  await connectDB();

  const { id } = await ctx.params;
  const url = new URL(req.url);
  const year = Number(url.searchParams.get('year') ?? new Date().getFullYear());
  if (!Number.isInteger(year)) {
    return NextResponse.json({ error: 'Invalid year' }, { status: 400 });
  }
  if (!Types.ObjectId.isValid(id))
    return NextResponse.json({ error: 'Invalid clientId' }, { status: 422 });

  const clientId = new Types.ObjectId(id);

  const budget = await BudgetYear.findOne({
    clientId,
    year,
  })
    .select({ categories: 1 })
    .lean<BudgetYearLean>();

  if (!budget) {
    return new NextResponse(JSON.stringify([]), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'private, max-age=20, stale-while-revalidate=60',
      },
    });
  }

  // Aggregate net spend per category for this client or year
  const spentAggr = await Transaction.aggregate<SpentAggRow>(
    [
      { $match: { clientId, year, voidedAt: { $exists: false } } },
      { $unwind: '$lines' },
      {
        $group: {
          _id: '$lines.categoryId',
          spent: {
            $sum: {
              $cond: [
                { $eq: ['$type', 'Purchase'] },
                '$lines.amount',
                { $multiply: [-1, '$lines.amount'] },
              ],
            },
          },
        },
      },
    ],
    { allowDiskUse: true }
  );

  const spentByCat = new Map<string, number>(
    spentAggr.map((r) => [
      String(r._id),
      Number.isFinite(r.spent) ? r.spent : 0,
    ])
  );

  const rows: BudgetRow[] = budget.categories.map(
    (cat: CategoryBudget): BudgetRow => {
      const key = String(cat.categoryId);
      const spent = spentByCat.get(key) ?? 0;
      const allocated = Math.round(cat.allocated);
      const categoryName = (cat.categoryName ?? 'Unknown').trim();

      return {
        categoryId: String(cat.categoryId),
        item: categoryName,
        category: categoryName,
        allocated,
        spent: Math.round(spent),
      };
    }
  );

  return new NextResponse(JSON.stringify(rows), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'private, max-age=15, stale-while-revalidate=60',
    },
  });
}
