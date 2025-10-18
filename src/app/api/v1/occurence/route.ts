/**
 * api/v1/occurence/route.ts
 * Author: Zahra Rizqita
 * Created on: 18/10/2025
 */

import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Occurrence from '@/models/Occurrence';

export async function GET(req: Request) {
  await connectDB();
  const { searchParams } = new URL(req.url);

  const start = searchParams.get('start')?.slice(0,10);
  const end   = searchParams.get('end')?.slice(0,10);
  const slugsCSV = searchParams.get('slugs');

  if (!start) return NextResponse.json({ error: 'Missing start' }, { status: 400 });
  if (!end)   return NextResponse.json({ error: 'Missing end' },   { status: 400 });
  if (!slugsCSV) return NextResponse.json({ error: 'Missing slugs' }, { status: 400 });

  const slugs = slugsCSV.split(',').map(s => s.trim().toLowerCase()).filter(Boolean);

  const rows = await Occurrence.find(
    { careItemSlug: { $in: slugs }, date: { $gte: start, $lte: end } },
    { careItemSlug: 1, date: 1, status: 1, _id: 0 }
  ).lean();

  const normalize = (s?: string) => {
    const v = (s || '').toLowerCase();
    if (v === 'waiting verification') return 'Waiting Verification';
    if (v === 'overdue') return 'Overdue';
    if (v === 'completed') return 'Completed';
    return 'Due';
  };

  return NextResponse.json(rows.map(r => ({
    careItemSlug: r.careItemSlug,
    date: r.date,
    status: normalize(r.status),
  })));
}
