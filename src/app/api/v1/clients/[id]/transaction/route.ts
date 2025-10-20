/**
 * Filename: /app/api/v1/clients/[id]/transaction/route.ts
 * Author: Zahra Rizqita
 * Date Created: 10/10/2025
 *
 * Handle api for transaction, list transaction and create multi-line purchase or refund
 */
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { BudgetYear } from "@/models/Budget";
import { Types } from 'mongoose';
import { getViewerRole } from "@/lib/data";
import { Transaction } from "@/models/Transaction";

type FETransaction = { 
  id: string; clientId:
  string; type: 'Purchase' | 'Refund';
  date: string;
  madeBy: string;
  items: string[];
  receipt: string;
};

type PurchaseLineInput = {
  categoryId: string;
  careItemSlug: string;
  label?: string;
  amount: number;
}

type RefundLineInput = {
  refundOfTransId: string;
  refundOfLineId: string;
  amount: number;
  label?: string;
}

type CreatePurchaseBody = {
  type: 'Purchase';
  date: string;
  madeByUserId: string;
  receiptUrl?: string;
  note?: string;
  lines: PurchaseLineInput[];
};

type CreateRefundBody = {
  type: 'Refund';
  date: string;
  madeByUserId: string;
  receiptUrl?: string;
  note?: string;
  lines: RefundLineInput[];
};

type CreateBody = CreatePurchaseBody | CreateRefundBody;

type TypeSumRow = {_id: 'Purchase' | 'Refund'; sum: number};



export async function GET(
  req: Request,
  {params}: {params: Promise<{id: string}>}
){
  const {id} = await params;
  await connectDB();

  const url = new URL(req.url);
  const yearParam = url.searchParams.get('year');
  const year = Number.isFinite(Number(yearParam)) ? Number(yearParam) : new Date().getFullYear();

  let clientId: Types.ObjectId;
  try{
    clientId = new Types.ObjectId(id);
  } catch{
    return NextResponse.json({error: 'Invalid ClientId'}, {status: 422});
  }

  const trans = await Transaction
    .find({clientId, year, voidedAt: {$exists: false}})
    .sort({date: -1, _id: -1})
    .lean();

  const out: FETransaction[] = trans.map((t) => ({
    id: String(t._id),
    clientId: String(t.clientId),
    type: t.type as 'Purchase' | 'Refund',
    date: new Date(t.date).toISOString().slice(0, 10),
    madeBy: String(t.madeByUserId),
    items: (t.lines ?? []).map((l: { label?: string; careItemSlug: string }) => l.label ?? l.careItemSlug),
    receipt: t.receiptUrl ?? '',
  }));

  return NextResponse.json(out);
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const {id} = await params;
  await connectDB();

  const role = await getViewerRole();
  if (role !== 'carer' && role !== 'management') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body: CreateBody = await req.json();
  const date = new Date(body.date);
  if (Number.isNaN(date.getTime())) {
    return NextResponse.json({ error: 'Invalid date' }, { status: 422 });
  }

  const year = date.getUTCFullYear();
  const currentYear = new Date().getUTCFullYear();
  if (year < currentYear) {
    return NextResponse.json({ error: 'Past year is read-only' }, { status: 409 });
  }

  let clientId: Types.ObjectId;
  try {
    clientId = new Types.ObjectId(id);
  } catch {
    return NextResponse.json({ error: 'Invalid clientId' }, { status: 422 });
  }

  let madeByUserId: Types.ObjectId;
  try {
    madeByUserId = new Types.ObjectId(body.madeByUserId);
  } catch {
    return NextResponse.json({ error: 'Invalid madeByUserId' }, { status: 422 });
  }

  // purchase
  if (body.type === 'Purchase') {
    if (!Array.isArray(body.lines) || body.lines.length === 0) {
      return NextResponse.json({ error: 'At least one line required' }, { status: 422 });
    }

    const lines = body.lines.map((ln) => ({
      categoryId: new Types.ObjectId(ln.categoryId),
      careItemSlug: ln.careItemSlug.toLowerCase(),
      label: ln.label ?? ln.careItemSlug,
      amount: Number(ln.amount),
    }));

    if (lines.some((l) => l.amount < 0 || Number.isNaN(l.amount))) {
      return NextResponse.json({ error: 'Invalid amount' }, { status: 422 });
    }

    const created = await Transaction.create({
      clientId,
      year,
      date,
      type: 'Purchase',
      madeByUserId,
      receiptUrl: body.receiptUrl,
      note: body.note,
      lines,
    });

    await updateBudgetTotalsAndSurplus(clientId, year, 0);
    return NextResponse.json({ ok: true, id: String(created._id) });
  }

  // refund
  if (!Array.isArray(body.lines) || body.lines.length === 0) {
    return NextResponse.json({ error: 'At least one refund line required' }, { status: 422 });
  }

  const refundLines: {
    categoryId: Types.ObjectId;
    careItemSlug: string;
    label?: string;
    amount: number;
    refundOfTransId: Types.ObjectId;
    refundOfLineId: Types.ObjectId;
  }[] = [];

  for (const r of body.lines) {
    let origTransId: Types.ObjectId;
    let refundLineId: Types.ObjectId;
    try {
      origTransId = new Types.ObjectId(r.refundOfTransId);
      refundLineId = new Types.ObjectId(r.refundOfLineId);
    } catch {
      return NextResponse.json({ error: 'Invalid refund reference ids' }, { status: 422 });
    }

    // verify transaction exists
    const original = await Transaction.findOne({
        _id: origTransId,
        clientId,
        type: 'Purchase',
        voidedAt: {$exists: false},
    }).lean();

    if(!original) return NextResponse.json({error: 'Original purchase not found'}, {status: 404});
    if(original.year !== year) return NextResponse.json({error: 'Refund must be in the same year as original purchase'}, {status: 409});

    const lineRows = await Transaction.aggregate<{
      line: {
        _id: Types.ObjectId;
        categoryId: Types.ObjectId;
        careItemSlug: string;
        label?: string;
        amount: number;
      };
    }>([
      { $match: { _id: origTransId, clientId } },
      { $unwind: '$lines' },
      { $match: { 'lines._id': refundLineId } },
      { $project: { line: '$lines' } },
    ]);

    if (lineRows.length === 0) {
      return NextResponse.json({ error: 'Original line not found' }, { status: 404 });
    }

    const origLine = lineRows[0].line;

    const alreadyRefRows = await Transaction.aggregate<{ sum: number }>([
      {
        $match: {
          clientId,
          year,
          type: 'Refund',
          voidedAt: { $exists: false },
          'lines.refundOfTransId': origTransId,
          'lines.refundOfLineId': refundLineId,
        },
      },
      { $unwind: '$lines' },
      {
        $match: {
          'lines.refundOfTransId': origTransId,
          'lines.refundOfLineId': refundLineId,
        },
      },
      { $group: { _id: null, sum: { $sum: '$lines.amount' } } },
    ]);

    const refundedSoFar = Number(alreadyRefRows[0]?.sum ?? 0);
    const remaining = Math.max(0, origLine.amount - refundedSoFar);

    const amt = Number(r.amount);
    if (!(amt >= 0)) {
      return NextResponse.json({ error: 'Invalid refund amount' }, { status: 422 });
    }
    if (amt > remaining + 1e-6) {
      return NextResponse.json({ error: 'Refund exceeds original line amount' }, { status: 422 });
    }

    refundLines.push({
      categoryId: origLine.categoryId,
      careItemSlug: origLine.careItemSlug,
      label: r.label ?? origLine.label ?? origLine.careItemSlug,
      amount: amt,
      refundOfTransId: origTransId,
      refundOfLineId: refundLineId,
    });
  }

  const createdRefund = await Transaction.create({
    clientId,
    year,
    date,
    type: 'Refund',
    madeByUserId,
    receiptUrl: body.receiptUrl,
    note: body.note,
    lines: refundLines,
  });

  const refundDelta = refundLines.reduce((s, l) => s + l.amount, 0);
  await updateBudgetTotalsAndSurplus(clientId, year, refundDelta);

  return NextResponse.json({ ok: true, id: String(createdRefund._id) });
}

async function updateBudgetTotalsAndSurplus(
  clientId: Types.ObjectId,
  year: number,
  refundDelta: number
): Promise<void> {
  const sumRows = await Transaction.aggregate<{ _id: 'Purchase' | 'Refund'; sum: number }>([
    { $match: { clientId, year, voidedAt: { $exists: false } } },
    { $unwind: '$lines' },
    { $group: { _id: '$type', sum: { $sum: '$lines.amount' } } },
  ]);

  const byType = new Map<'Purchase' | 'Refund', number>(
    sumRows.map((r) => [r._id, Number(r.sum)])
  );
  const purchases = byType.get('Purchase') ?? 0;
  const refunds = byType.get('Refund') ?? 0;

  const budget = await BudgetYear.findOne({ clientId, year });
  if (!budget) return;

  budget.totals.spent = Math.max(0, purchases - refunds);
  if (refundDelta > 0) {
    budget.surplus = Math.max(0, budget.surplus + refundDelta);
  }
  await budget.save();
}