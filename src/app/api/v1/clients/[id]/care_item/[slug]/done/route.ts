/**
 * Filename: /app/api/care-item/[slug]/done/route.ts
 * Author: Zahra Rizqita
 * Date Created: 15/10/2025
 *
 * Handle api for carer to add comment, upload a file and marking a task as done -> change status to waiting verification
 */
import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import CareItem, { CareItemDoc } from '@/models/CareItem';
import Occurrence from '@/models/Occurrence';
import { Types } from 'mongoose';

type Body = {
  doneAt?: string;
  file?: string;
  comment?: string;
};

type UpdateOperation = {
  $setOnInsert?: {
    careItemSlug: string;
    clientId: Types.ObjectId;
    date: string;
  };
  $set?: {
    status: 'Waiting Verification';
    doneAt: Date;
  };
  $push?: {
    files?: string;
    comments?: string;
  };
};

export async function POST(
  req: Request,
  { params }: { params: { id: string; slug: string } }
) {
  await connectDB();

  const slug = (params.slug || '').trim().toLowerCase();
  const clientIdStr = params.id;

  if (!Types.ObjectId.isValid(clientIdStr)) {
    return NextResponse.json({ error: 'invalid client id' }, { status: 400 });
  }
  const clientId = new Types.ObjectId(clientIdStr);

  const { doneAt, file, comment } = (await req.json()) as Body;

  if (!doneAt) {
    return NextResponse.json({ error: 'doneAt required' }, { status: 400 });
  }
  if (!file) {
    return NextResponse.json({ error: 'File required' }, { status: 400 });
  }

  const date = doneAt.slice(0, 10);

  const careItem = await CareItem.findOne({ slug }, { clientId: 1 }).lean<
    Pick<CareItemDoc, 'clientId'>
  >();
  if (!careItem) {
    return NextResponse.json({ error: 'Care item not found' }, { status: 404 });
  }
  if (String(careItem.clientId) !== String(clientId)) {
    return NextResponse.json(
      { error: 'Care item does not belong to this client' },
      { status: 409 }
    );
  }

  const update: UpdateOperation = {
    $setOnInsert: { careItemSlug: slug, clientId, date },
    $set: { status: 'Waiting Verification', doneAt: new Date(doneAt) },
    $push: { files: file },
  };
  if (comment && comment.trim()) {
    update.$push = { ...update.$push, comments: comment.trim() };
  }

  const doc = await Occurrence.findOneAndUpdate(
    { careItemSlug: slug, clientId, date },
    update,
    { new: true, upsert: true, runValidators: true }
  ).lean();

  return NextResponse.json(doc);
}
