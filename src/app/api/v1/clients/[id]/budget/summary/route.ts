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
  const year = Number(url.searchParams.get('year') ?? new Date().getFullYear());
  if (!Number.isInteger(year)) {
    return NextResponse.json({ error: 'Invalid year' }, { status: 400 });
  }

  if (!Types.ObjectId.isValid(id)) {
    return NextResponse.json({ error: 'Invalid ClientId' }, { status: 422 });
  }
  const clientId = new Types.ObjectId(id);

  const doc = await BudgetYear.findOne({ clientId, year })
    .select({
      annualAllocated: 1,
      surplus: 1,
      openingCarryover: 1,
      'totals.spent': 1,
      'totals.allocated': 1,
    })
    .lean();

  if (!doc) {
    return new NextResponse(
      JSON.stringify({
        annualAllocated: 0,
        spent: 0,
        remaining: 0,
        surplus: 0,
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'private, max-age=20, stale-while-revalidate=60',
        },
      }
    );
  }

  const annualAllocated = Math.round(doc.annualAllocated ?? 0);
  const spent = Math.round(doc.totals?.spent ?? 0);
  const remaining = Math.max(0, annualAllocated - spent);
  const surplus = Math.max(
    0,
    Math.round(doc.surplus ?? annualAllocated - (doc.totals?.allocated ?? 0))
  );

  const body: SummaryResponse = {
    annualAllocated,
    spent,
    remaining,
    surplus,
    openingCarryover: Number(doc.openingCarryover ?? 0),
  };

  return new NextResponse(JSON.stringify(body), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'private, max-age=20, stale-while-revalidate=60',
    },
  });
}
