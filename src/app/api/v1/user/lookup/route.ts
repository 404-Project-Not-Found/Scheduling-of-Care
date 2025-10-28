/**
 * File path: /api/v1/user/lookup/route.ts
 * Author: Zahra Rizqita
 * Date Created: 28/10/2025
 *
 * Fetch the name of carer
 */
import { NextResponse } from 'next/server';
import { Types } from 'mongoose';
import { connectDB } from '@/lib/mongodb';
import User from '@/models/User';

type LookupBody = { ids: string[] };

export async function POST(req: Request) {
  await connectDB();

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const ids = (body as LookupBody)?.ids;
  if (!Array.isArray(ids) || ids.length === 0) {
    return NextResponse.json(
      { error: 'ids must be a non-empty array' },
      { status: 400 }
    );
  }

  const validIds = [...new Set(ids)].filter((id) => Types.ObjectId.isValid(id));
  if (validIds.length === 0) {
    return NextResponse.json(
      { error: 'No valid ObjectIds provided' },
      { status: 400 }
    );
  }

  const users = await User.find({ _id: { $in: validIds } }).select(
    '_id fullName'
  );

  const map: Record<string, string> = {};
  for (const u of users) map[String(u._id)] = u.fullName;

  return NextResponse.json({ users: map });
}
