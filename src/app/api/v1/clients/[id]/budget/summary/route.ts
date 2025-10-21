/**
 * Filename: /app/api/v1/clients/[id]/budget/summary/route.ts
 * Author: Zahra Rizqita
 * Date Created: 10/10/2025
 *
 * Handle api for budget, handle Annual, amount spent, remaining and surplus - the four boxes
 */
import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { BudgetYear } from '@/models/Budget';
import { Types } from 'mongoose';

type SummaryResponse = {
  annualAllocated: number;
  spent: number;
  remaining: number;
  surplus: number;
  openingCarryover?: number;
};

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await connectDB();

  const url = new URL(req.url);
  const yearParam = url.searchParams.get('year');
  const year = Number.isFinite(Number(yearParam))
    ? Number(yearParam)
    : new Date().getFullYear();

  let clientId: Types.ObjectId;
  try {
    clientId = new Types.ObjectId(id);
  } catch {
    return NextResponse.json({ error: 'Invalid ClientId' }, { status: 422 });
  }

  const doc = await BudgetYear.findOne({ clientId, year }).lean();
  if (!doc) {
    const empty: SummaryResponse = {
      annualAllocated: 0,
      spent: 0,
      remaining: 0,
      surplus: 0,
    };
    return NextResponse.json(empty);
  }

  const annualAllocated = Math.round(doc.annualAllocated ?? 0);
  const spent = Math.round(doc.totals?.spent ?? 0);
  const remaining = Math.max(0, annualAllocated - spent);
  const surplus = Math.max(
    0,
    Math.round(doc.surplus ?? annualAllocated - (doc.totals?.allocated ?? 0))
  );

  const resBody: SummaryResponse = {
    annualAllocated,
    spent,
    remaining,
    surplus,
    openingCarryover: Number(doc.openingCarryover ?? 0),
  };
  return NextResponse.json(resBody);
}
