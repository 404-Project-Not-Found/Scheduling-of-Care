import { NextResponse } from 'next/server';
import { Types } from 'mongoose';
import { connectDB } from '@/lib/mongodb';
import Occurrence, { IOccurrence } from '@/models/Occurrence';

export async function GET(
  req: Request,
  { params }: { params: { id: string; slug: string } }
) {
  await connectDB();

  const { id, slug } = await params;
  if (!Types.ObjectId.isValid(id)) {
    return NextResponse.json({ error: 'Invalid client id' }, { status: 400 });
  }
  const clientId = new Types.ObjectId(id);
  const s = (slug || '').trim().toLowerCase();

  const u = new URL(req.url);
  const dateStr = (u.searchParams.get('date') || '').slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return NextResponse.json(
      { error: 'date required as YYYY-MM-DD' },
      { status: 400 }
    );
  }

  // Convert to a 00:00:00Z Date because your schema stores Date
  const start = new Date(`${dateStr}T00:00:00.000Z`);
  const end = new Date(`${dateStr}T23:59:59.999Z`);

  const doc = await Occurrence.findOne(
    { careItemSlug: s, clientId, date: { $gte: start, $lte: end } },
    {
      careItemSlug: 1,
      clientId: 1,
      date: 1,
      status: 1,
      files: 1,
      comments: 1,
      _id: 0,
    }
  ).lean<
    Pick<IOccurrence, 'careItemSlug' | 'date' | 'status' | 'files' | 'comments'>
  >();

  if (!doc)
    return NextResponse.json(
      { error: 'Occurrence not found' },
      { status: 404 }
    );

  return NextResponse.json({
    careItemSlug: doc.careItemSlug,
    date:
      doc.date instanceof Date ? doc.date.toISOString().slice(0, 10) : doc.date,
    status: doc.status,
    files: Array.isArray(doc.files) ? doc.files : [],
    comments: Array.isArray(doc.comments) ? doc.comments : [],
  });
}
