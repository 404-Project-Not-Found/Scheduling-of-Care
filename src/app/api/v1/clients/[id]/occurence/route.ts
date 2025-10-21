/**
 * api/v1/care_item/[slug]/occurence/route.ts
 * Author: Zahra Rizqita
 * Created on: 18/10/2025
 */

import { NextResponse } from 'next/server';
import { Types } from 'mongoose';
import { connectDB } from '@/lib/mongodb';
import Occurrence from '@/models/Occurrence';

type Row = { careItemSlug: string; date: string; status?: string };

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  await connectDB();

  const { searchParams } = new URL(req.url);
  const startStr = searchParams.get('start')?.slice(0, 10);
  const endStr = searchParams.get('end')?.slice(0, 10);
  const slugsCSV = searchParams.get('slugs');

  if (!Types.ObjectId.isValid(params.id)) {
    return NextResponse.json({ error: 'Invalid client id' }, { status: 400 });
  }
  const clientId = new Types.ObjectId(params.id);

  if (!startStr)
    return NextResponse.json({ error: 'Missing start' }, { status: 400 });
  if (!endStr)
    return NextResponse.json({ error: 'Missing end' }, { status: 400 });
  if (!slugsCSV)
    return NextResponse.json({ error: 'Missing slugs' }, { status: 400 });

  const start = new Date(`${startStr}T00:00:00.000Z`);
  const end = new Date(`${endStr}T23:59:59.999Z`);

  const slugs = slugsCSV
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);

  const rows = await Occurrence.find(
    {
      clientId,
      careItemSlug: { $in: slugs },
      date: { $gte: start, $lte: end },
    },
    { careItemSlug: 1, date: 1, status: 1, _id: 0 }
  ).lean<Row[]>();

  const normalize = (s?: string) => {
    const v = (s || '').toLowerCase();
    if (v === 'waiting verification') return 'Waiting Verification';
    if (v === 'overdue') return 'Overdue';
    if (v === 'completed') return 'Completed';
    return 'Due';
  };

  return NextResponse.json(
    rows.map((r) => ({
      careItemSlug: r.careItemSlug,
      date: r.date,
      status: normalize(r.status),
    }))
  );
}
