import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Types } from 'mongoose';
import { Transaction } from "@/models/Transaction";

type RefundGroupKey = {
  refundOfTransId: Types.ObjectId;
  refundOfLineId: Types.ObjectId;
};

type RefundAggRow = {
  _id: RefundGroupKey;
  sum: number;
};

export async function GET(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  await connectDB();

  const { id } = await ctx.params;
  if (!id || !Types.ObjectId.isValid(id)) {
    return NextResponse.json({ error: 'Invalid client id in path' }, { status: 400 });
  }
  const clientId = new Types.ObjectId(id);

  const url = new URL(req.url);
  const yearParam = url.searchParams.get('year');
  const year = Number.isFinite(Number(yearParam)) ? Number(yearParam) : new Date().getFullYear();

  const purchaseLines = await Transaction.aggregate<{
    purchaseTransId: Types.ObjectId;
    purchaseDate: Date;
    lineId: Types.ObjectId;
    categoryId: Types.ObjectId;
    careItemSlug: string;
    label?: string;
    amount: number;
  }>([
    { $match: { clientId, year, type: 'Purchase', voidedAt: { $exists: false } } },
    { $unwind: '$lines' },
    {
      $project: {
        purchaseTransId: '$_id',
        purchaseDate: '$date',
        lineId: '$lines._id',
        categoryId: '$lines.categoryId',
        careItemSlug: '$lines.careItemSlug',
        label: '$lines.label',
        amount: '$lines.amount',
      },
    },
  ]);

  if (purchaseLines.length === 0) {
    return NextResponse.json([]); // no purchases, nothing refundable
  }

  // 2) Sum refunds grouped by (refundOfTransId, refundOfLineId)
  const refundSums = await Transaction.aggregate<RefundAggRow>([
    { $match: { clientId, year, type: 'Refund', voidedAt: { $exists: false } } },
    { $unwind: '$lines' },
    {
      $group: {
        _id: {
          refundOfTransId: '$lines.refundOfTransId',
          refundOfLineId: '$lines.refundOfLineId',
        },
        sum: { $sum: '$lines.amount' },
      },
    },
  ]);

  const refundedMap = new Map<string, number>();
  for (const r of refundSums) {
    const key = `${String(r._id.refundOfTransId)}:${String(r._id.refundOfLineId)}`;
    refundedMap.set(key, Number(r.sum ?? 0));
  }

  const out = purchaseLines
    .map((pl) => {
      const key = `${String(pl.purchaseTransId)}:${String(pl.lineId)}`;
      const refundedSoFar = refundedMap.get(key) ?? 0;
      const originalAmount = Number(pl.amount ?? 0);
      const remainingRefundable = Math.max(0, originalAmount - refundedSoFar);

      return {
        purchaseTransId: String(pl.purchaseTransId),
        purchaseDate: new Date(pl.purchaseDate).toISOString().slice(0, 10),
        lineId: String(pl.lineId),
        categoryId: String(pl.categoryId),
        careItemSlug: String((pl.careItemSlug || '').toLowerCase()),
        label: pl.label != null ? String(pl.label) : undefined,
        originalAmount,
        refundedSoFar: Number(refundedSoFar),
        remainingRefundable,
      };
    })
    .filter((row) => row.remainingRefundable > 0);

  return NextResponse.json(out);
}