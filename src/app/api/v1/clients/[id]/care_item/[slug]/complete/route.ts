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

export async function POST(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  await connectDB();
  const { slug: rawSlug } = await params;
  const slug = rawSlug.toLowerCase();

  const { date } = (await req.json()) as { date: string };
  if (!date)
    return NextResponse.json(
      { error: 'date required -- complete care item' },
      { status: 400 }
    );

  const dateISO = date.slice(0, 10);

  const occur = await Occurrence.findOne({ careItemSlug: slug, date });
  if (!occur)
    return NextResponse.json({ error: 'Occurence not found' }, { status: 404 });
  if (occur.status !== 'Waiting Verification') {
    return NextResponse.json(
      { error: 'Status must be Occurence not found' },
      { status: 409 }
    );
  }

  if (!occur) {
    return NextResponse.json(
      {
        error:
          'This Care Item occurrence is not found or is not yet done by carer yet',
      },
      { status: 409 }
    );
  }

  occur.status = 'Completed';
  occur.verifiedAt = new Date();
  await occur.save();

  await CareItem.updateOne({ slug }, { $set: { lastDone: dateISO } });

  return NextResponse.json(occur.toObject());
}
