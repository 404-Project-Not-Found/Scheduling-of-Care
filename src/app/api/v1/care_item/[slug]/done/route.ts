/**
 * Filename: /app/api/care-item/[slug]/done/route.ts
 * Author: Zahra Rizqita
 * Date Created: 15/10/2025
 *
 * Handle api for carer to add comment, upload a file and marking a task as done
 */

import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import CareItem from '@/models/CareItem';

interface CompleteBody {
  file: string;
  comment?: string;
  doneAt?: string;
}

type CareItemLean = {
  slug: string;
  files?: string[];
  lastDone?: string;
  comments?: string[];
  status?: string;
};

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

function isISODateOnly(s: unknown): s is string {
  return typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s);
}

export async function POST(
  req: Request,
  { params }: { params: { slug: string } }
) {
  await connectDB();
  const { slug } = params;

  let body: CompleteBody;
  try {
    body = (await req.json()) as CompleteBody;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const file = (body.file ?? '').trim();
  if (!file) {
    return NextResponse.json(
      { error: 'A file must be provided to complete this task.' },
      { status: 422 }
    );
  }

  const completedAt = isISODateOnly(body.doneAt) ? body.doneAt : todayISO();
  const comment = (body.comment ?? '').trim();

  const update: Record<string, unknown> = {
    $set: { status: 'Completed', lastDone: completedAt },
    $push: { files: file },
  };
  if (comment) {
    (update.$push as Record<string, unknown>).comments = comment;
  }

  const updated = await CareItem.findOneAndUpdate(
    { slug: slug.toLowerCase() },
    update,
    { new: true }
  )
    .select('slug status files comments lastDone')
    .lean<CareItemLean | null>();

  if (!updated) {
    return NextResponse.json({ error: 'Care item not found' }, { status: 404 });
  }

  return NextResponse.json(updated);
}
