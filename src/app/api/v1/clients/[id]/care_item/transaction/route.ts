import { NextResponse, NextRequest } from 'next/server';
import { Types } from 'mongoose';
import { connectDB } from '@/lib/mongodb';
import CareItem from '@/models/CareItem';

export async function GET(req: NextRequest, { params }: { params: { id: string } }): Promise<NextResponse> {
  await connectDB();
  const { searchParams } = new URL(req.url);

  const q = (searchParams.get('q') || '').trim();
  const status = searchParams.get('status') || undefined;
  const categoryIdStr = (searchParams.get('categoryId') || '').trim();
  const categoryName = (searchParams.get('category') || '').trim();
  const includeDeleted = (searchParams.get('includeDeleted') || 'false').toLowerCase() === 'true';
  const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10) || 20, 100);

  const idFromPath = (params?.id || '').trim();
  if (!idFromPath || !Types.ObjectId.isValid(idFromPath)) {
    return NextResponse.json({ error: 'Invalid client id in path' }, { status: 400 });
  }
  const clientId = new Types.ObjectId(idFromPath);

  const filter: Record<string, unknown> = { clientId };

  if (!includeDeleted) filter.deleted = { $ne: true };
  if (status) filter.status = status;

  if (categoryIdStr) {
    if (!Types.ObjectId.isValid(categoryIdStr)) {
      return NextResponse.json({ error: 'categoryId must be a valid ObjectId' }, { status: 400 });
    }
    filter.categoryId = new Types.ObjectId(categoryIdStr);
  } else if (categoryName) {
    filter.category = categoryName;
  }

  if (q.length > 0) {
    filter.label = { $regex: q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' };
  }

  const tasks = await CareItem.find(filter)
    .sort({ updatedAt: -1, createdAt: -1, _id: -1 })
    .limit(limit)
    .lean();

  const response = tasks.map((t) => ({
    label: t.label,
    slug: t.slug,
    frequency: t.frequency ?? '',
    lastDone: t.lastDone ?? '',
    status: t.status,
    category: t.category,
    categoryId: t.categoryId?.toString?.() ?? String(t.categoryId),
    deleted: Boolean(t.deleted),
    clientId: t.clientId?.toString?.() ?? String(t.clientId),
    frequencyDays: t.frequencyDays ?? undefined,
    frequencyCount: t.frequencyCount ?? undefined,
    frequencyUnit: t.frequencyUnit ?? undefined,
    dateFrom: t.dateFrom ?? undefined,
    dateTo: t.dateTo ?? undefined,
    notes: t.notes ?? '',
  }));

  return NextResponse.json(response);
}