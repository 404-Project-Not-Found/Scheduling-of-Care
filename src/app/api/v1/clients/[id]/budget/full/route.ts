/**
 *
 */

import { NextResponse } from 'next/server';
import { Types } from 'mongoose';
import { connectDB } from '@/lib/mongodb';
import { BudgetYear } from '@/models/Budget';
import { Transaction } from '@/models/Transaction';

export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  await connectDB();

  const { id } = await ctx.params;
  const u = new URL(req.url);
  const year = Number(u.searchParams.get('year') ?? new Date().getFullYear());
  if (!Types.ObjectId.isValid(id) || !Number.isInteger(year)) {
    return NextResponse.json({ error: 'Invalid params' }, { status: 400 });
  }
  const clientId = new Types.ObjectId(id);

  const budget = await BudgetYear.findOne({ clientId, year })
    .select({ annualAllocated: 1, surplus: 1, openingCarryover: 1, 'totals.spent': 1, 'totals.allocated': 1, categories: 1 })
    .lean();

  if (!budget) {
    return NextResponse.json(
      { summary: { annualAllocated: 0, spent: 0, remaining: 0, surplus: 0 }, rows: [] },
      { headers: { 'Cache-Control': 'private, max-age=20, stale-while-revalidate=60' } }
    );
  }

  const spentAgg = await Transaction.aggregate<{ _id: Types.ObjectId; spent: number }>([
    { $match: { clientId, year, voidedAt: { $exists: false } } },
    { $project: { lines: 1, type: 1 } },
    { $unwind: '$lines' },
    {
      $group: {
        _id: '$lines.categoryId',
        spent: {
          $sum: {
            $cond: [{ $eq: ['$type', 'Purchase'] }, '$lines.amount', { $multiply: [-1, '$lines.amount'] }],
          },
        },
      },
    },
  ], { allowDiskUse: true });

  const spentByCat = new Map(spentAgg.map(r => [String(r._id), r.spent ?? 0]));

  const rows = (budget.categories ?? []).map(c => {
    const categoryId = String(c.categoryId);
    const name = (c.categoryName ?? 'Unknown').trim();
    const allocated = Math.max(0, Math.round(c.allocated ?? 0));
    const spent = Math.round(spentByCat.get(categoryId) ?? 0);
    return { categoryId, item: name, category: name, allocated, spent };
  });

  const annualAllocated = Math.round(budget.annualAllocated ?? 0);
  const spent = Math.round(budget.totals?.spent ?? 0);
  const remaining = Math.max(0, annualAllocated - spent);
  const surplus = Math.max(0, Math.round(budget.surplus ?? annualAllocated - (budget.totals?.allocated ?? 0)));

  return new NextResponse(JSON.stringify({
    ok: true,
    summary: { annualAllocated, spent, remaining, surplus, openingCarryover: Number(budget.openingCarryover ?? 0) },
    rows
  }), {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'private, max-age=15, stale-while-revalidate=60',
    },
  });
}
