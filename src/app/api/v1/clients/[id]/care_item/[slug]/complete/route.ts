/**
 * Filename: /app/api/care-item/[slug]/done/route.ts
 * Author: Zahra Rizqita
 * Date Created: 15/10/2025
 *
 * Handle api for management when a care item is verified and status changes to complete
 */
import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import CareItem from '@/models/CareItem';
import Occurrence from '@/models/Occurrence';
import { Types } from 'mongoose';

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string, slug: string }> }
) {
  await connectDB();
  const {id: clientIdStr, slug: rawSlug } = await params;
  if (!Types.ObjectId.isValid(clientIdStr)) {
    return NextResponse.json({ error: 'invalid client id' }, { status: 400 });
  }
  const clientId = new Types.ObjectId(clientIdStr);
  const slug = rawSlug.toLowerCase();

  const { date } = (await req.json()) as { date: string };
  if (!date)
    return NextResponse.json(
      { error: 'date required -- complete care item' },
      { status: 400 }
    );

  const dateISO = date.slice(0, 10);

  const occur = await Occurrence.findOne({ careItemSlug: slug, clientId, date });

  if (!occur) return NextResponse.json({ error: 'Occurence not found' }, { status: 404 });

  if (occur.status !== 'Waiting Verification') {
    return NextResponse.json(
      { error: 'Status must Waiting Verification' },
      { status: 409 }
    );
  }

  occur.status = 'Completed';
  occur.verifiedAt = new Date();
  await occur.save();

  await CareItem.updateOne({ slug, clientId }, { $set: { lastDone: dateISO } });

  return NextResponse.json({ ...occur.toObject(), lastDone: dateISO });
}
