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

export async function POST(
  req: Request, 
  {params}: {params: Promise<{slug: string}>}
) {
  await connectDB();
  const {slug: rawSlug} = await params;
  const slug = rawSlug.toLowerCase();

  const {doneAt, file, comment} = await req.json() as {doneAt: string, file?: string, comment?: string};

  if(!doneAt || !file) return NextResponse.json({error: 'doneAt and file required'}, {status: 400});
  

  const careItem = await CareItem.findOne({slug}, {clientId: 1}).lean<Pick<CareItemDoc, 'clientId'>>();
  if(!careItem){
    return NextResponse.json({error: 'Care item not found'}, {status: 404});
  }

  const date = doneAt.slice(0, 10);

  const doc = await Occurrence.findOneAndUpdate(
    { careItemSlug: slug, date },
    {
      $setOnInsert: { 
        careItemSlug: slug,
        clientId: careItem.clientId, 
        date, 
      },
      $set: { status: 'Waiting Verification', doneAt: new Date() },
      ...(file ? { $push: { files: file } } : {}),
      ...(comment ? { $push: { comments: comment } } : {}),
    },
    { new: true, upsert: true }
  ).lean();

  return NextResponse.json(doc);
}
