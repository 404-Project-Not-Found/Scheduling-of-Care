/**
 * Filename: /app/api/v1/client/[id]/care-item/[slug]/route.ts
 * Author: Zahra Rizqita
 * Date Created: 24/09/2025
 * Updated -- 09/10/2025 -- client-scoped
 */

import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import CareItem, { CareItemDoc, Unit } from '@/models/CareItem';
import { Types } from 'mongoose';
import { toISO } from '@/lib/care-item-helpers/date-helpers';
import { findOrCreateNewCategory } from '@/lib/category-helpers';
import {
  normaliseCareItemPayLoad,
  errorJson,
} from '@/lib/care-item-helpers/care_item_utils';

export const runtime = 'nodejs';

type PutBody = {
  clientId?: string | null;
  clientName?: string;
  label?: string;
  status?: string;
  category?: string;
  frequencyCount?: number;
  frequencyUnit?: Unit | string;
  frequencyDays?: number;
  frequency?: string;
  dateFrom?: string;
  dateTo?: string;
  lastDone?: string;
  notes?: string;
  deleted?: boolean;
};

// get one care item by slug
export async function GET(
  _: Request,
  ctx: { params: Promise<{ slug: string }> }
) {
  await connectDB();
  const { slug } = await ctx.params;

  const task = await CareItem.findOne({
    slug: slug.toLowerCase(),
  }).lean<CareItemDoc | null>();
  if (!task || task.deleted) return errorJson('Task not found', 404);
  return NextResponse.json(task);
}

// update one care item
export async function PUT(
  req: Request,
  ctx: { params: Promise<{ slug: string }> }
) {
  await connectDB();

  const { slug } = await ctx.params;

  let body: PutBody;
  try {
    body = (await req.json()) as PutBody;
  } catch {
    return errorJson('Invalid JSON - api/v1/client/[id]/care_item/[slug]/PUT');
  }

  // Load existing to find current client
  const exist = await CareItem.findOne({
    slug: slug.toLowerCase(),
  }).lean<CareItemDoc | null>();
  if (!exist) return errorJson('Task not found', 404);

  // Find clientId to be updated
  const clientIdStr =
    body.clientId ?? (exist.clientId ? String(exist.clientId) : null);
  if (!clientIdStr || !Types.ObjectId.isValid(clientIdStr))
    return errorJson(
      'clientId must be a valid ObjectId -- care_item/[slug]/route.ts'
    );

  const clientId = new Types.ObjectId(clientIdStr);

  // Ensure category is client-scoped
  let nextCatId = exist.categoryId;
  let nextCatName = exist.category;
  if (typeof body.category === 'string' && body.category.trim()) {
    const c = await findOrCreateNewCategory({
      clientId,
      input: body.category.trim(),
    });
    nextCatId = c._id as Types.ObjectId;
    nextCatName = c.name;
  }

  // normalise
  const dateFromISO = toISO(body.dateFrom);
  const dateToISO = toISO(body.dateTo);
  if (dateFromISO && dateToISO && new Date(dateToISO) < new Date(dateFromISO)) {
    return errorJson('dateTo must be after dateFrom', 422);
  }

  const normalised = normaliseCareItemPayLoad({
    frequencyCount: body.frequencyCount,
    frequencyUnit: body.frequencyUnit,
    frequencyDays: body.frequencyDays,
    frequency: body.frequency,
    dateFrom: dateFromISO,
    dateTo: dateToISO,
    lastDone: body.lastDone,
  });

  const setPayLoad: Partial<CareItemDoc> = {};
  if (typeof body.label === 'string' && body.label.trim())
    setPayLoad.label = body.label.trim();
  if (typeof body.status === 'string' && body.status.trim())
    setPayLoad.status = body.status.trim();
  if (typeof body.notes === 'string') setPayLoad.notes = body.notes.trim();
  setPayLoad.clientId = clientId;
  setPayLoad.categoryId = nextCatId;
  if (nextCatName) setPayLoad.category = nextCatName;
  if (typeof body.clientName === 'string' && body.clientName.trim())
    setPayLoad.clientName = body.clientName.trim();
  if (normalised.dateFrom !== undefined)
    setPayLoad.dateFrom = normalised.dateFrom as string;
  if (normalised.dateTo !== undefined)
    setPayLoad.dateTo = normalised.dateTo as string;

  if (normalised.frequencyCount !== undefined)
    setPayLoad.frequencyCount = normalised.frequencyCount;
  if (normalised.frequencyUnit !== undefined)
    setPayLoad.frequencyUnit = normalised.frequencyUnit;
  if (normalised.frequencyDays !== undefined)
    setPayLoad.frequencyDays = normalised.frequencyDays;
  if (normalised.frequency !== undefined)
    setPayLoad.frequency = normalised.frequency;
  if (normalised.lastDone !== undefined)
    setPayLoad.lastDone = normalised.lastDone;

  if (typeof body.deleted === 'boolean') setPayLoad.deleted = body.deleted;

  const updated = await CareItem.findOneAndUpdate(
    { slug: slug.toLowerCase() },
    { $set: setPayLoad },
    { new: true }
  ).lean();

  if (!updated) return errorJson('Task not found', 404);
  return NextResponse.json(updated);
}

// permanently delete task
export async function DELETE(
  _req: Request,
  { params }: { params: { slug: string } }
) {
  await connectDB();

  const slug = params.slug.toLowerCase();

  const deleted = await CareItem.findOneAndDelete({ slug }).lean();

  if (!deleted) return errorJson('Task not found', 400);

  return NextResponse.json({ ok: true, slug, deleted: true });
}
