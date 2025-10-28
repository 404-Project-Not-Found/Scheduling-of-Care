/**
 * Filename: /app/api/v1/clients/[id]/budget/years/route.ts
 * Author: Zahra Rizqita
 * Date Created: 19/10/2025
 *
 * Return years where budget and transaction exist for this client
 */
import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { BudgetYear } from '@/models/Budget';
import { Types } from 'mongoose';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await connectDB();

  if (!Types.ObjectId.isValid(id)) {
    return NextResponse.json({ error: 'Invalid ClientId' }, { status: 422 });
  }
  const clientId = new Types.ObjectId(id);

  const yearsRaw = await BudgetYear.distinct('year', { clientId });
  const years = yearsRaw
    .map(Number)
    .filter(Number.isFinite)
    .sort((a, b) => b - a);

  return new NextResponse(JSON.stringify(years), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=60, stale-while-revalidate=300',
    },
  });
}
