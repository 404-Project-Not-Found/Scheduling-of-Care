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

const ymd = (d: Date) => d.toISOString().slice(0, 10);

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  await connectDB();

  const { id } = await params;
  if (!id || !Types.ObjectId.isValid(id)) {
    return NextResponse.json({ error: 'Invalid client id' }, { status: 400 });
  }
  const clientId = new Types.ObjectId(id);

  const { searchParams } = new URL(req.url);
  const startStr = searchParams.get('start')?.slice(0, 10);
  const endStr = searchParams.get('end')?.slice(0, 10);
  const slugsCSV = searchParams.get('slugs');

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
  ).lean();

  const normalize = (s?: string): Row['status'] => {
    const v = (s || '').toLowerCase();
    if (v === 'waiting verification') return 'Waiting Verification';
    if (v === 'overdue') return 'Overdue';
    if (v === 'completed') return 'Completed';
    return 'Due';
  };

  const payload: Row[] = rows.map((r) => ({
    careItemSlug: String(r.careItemSlug).toLowerCase(),
    date:
      typeof r.date === 'string' ? r.date.slice(0, 10) : ymd(r.date as Date),
    status: normalize(r.status as string | undefined),
  }));

  return NextResponse.json(payload);
}
