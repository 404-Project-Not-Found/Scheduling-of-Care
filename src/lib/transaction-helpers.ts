/**
 * Filename: /lib/transaction-helpers.ts
 * Author: Zahra Rizqita
 * Date Created: 16/09/2025
 */

export type FETransaction = {
  id: string;
  clientId: string;
  type: 'Purchase' | 'Refund';
  date: string;
  madeBy: string;
  items: string[];
  receipt: string;
};

export type PurchaseLineInput = {
  categoryId: string;
  careItemSlug: string;
  label?: string;
  amount: number;
};

export type RefundLineInput = {
  refundOfTransId: string;
  refundOfLineId: string;
  label?: string;
  amount: number;
};

export type CreatePurchaseBody = {
  type: 'Purchase';
  date: string; // YYYY-MM-DD
  madeByUserId: string;
  receiptUrl?: string;
  note?: string;
  lines: PurchaseLineInput[];
};

export type CreateRefundBody = {
  type: 'Refund';
  date: string; // YYYY-MM-DD
  madeByUserId: string;
  receiptUrl?: string;
  note?: string;
  lines: RefundLineInput[];
};

export type RefundableLine = {
  purchaseTransId: string;
  purchaseDate: string;
  lineId: string;
  categoryId: string;
  careItemSlug: string;
  label?: string;
  originalAmount: number;
  refundedSoFar: number;
  remainingRefundable: number;
};

export type PurchaseLineDraft = {
  id: string;
  categoryId: string;
  careItemSlug: string;
  label: string;
  amount: string;
};

export type RefundLineDraft = {
  id: string;
  categoryId: string;
  careItemSlug: string;
  occurrenceKey: string;
  amount: string;
};

export type CreateTransactionBody = CreatePurchaseBody | CreateRefundBody;

// helper for refund transaction
export type RefundablesFE = {
  purchaseTransId: string;
  purchaseDate: string;
  lineId: string;
  categoryId: string;
  careItemSlug: string;
  label?: string;
  originalAmount: number;
  refundedSoFar: number;
  remainingRefundable: number;
};

export async function getTransactionsFE(
  clientId: string,
  year: number,
  signal?: AbortSignal
): Promise<FETransaction[]> {
  const url = `/api/v1/clients/${encodeURIComponent(
    clientId
  )}/transaction?year=${encodeURIComponent(String(year))}`;

  const res = await fetch(url, { cache: 'no-store', signal });
  if (!res.ok) throw new Error(`getTransactionsFE failed (${res.status})`);

  const data = (await res.json()) as unknown;

  if (!Array.isArray(data)) return [];

  return data.map((t) => {
    const obj = t as Partial<FETransaction>;
    return {
      id: String(obj.id ?? ''),
      clientId: String(obj.clientId ?? ''),
      type: (obj.type === 'Refund' ? 'Refund' : 'Purchase') as
        | 'Purchase'
        | 'Refund',
      date: String(obj.date ?? ''),
      madeBy: String(obj.madeBy ?? ''),
      items: Array.isArray(obj.items) ? obj.items.map((s) => String(s)) : [],
      receipt: String(obj.receipt ?? ''),
    };
  });
}

export async function addTransactionFE(
  clientId: string,
  payload: CreateTransactionBody,
  signal?: AbortSignal
): Promise<{ ok: true; id: string }> {
  const url = `/api/v1/clients/${encodeURIComponent(clientId)}/transaction`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    cache: 'no-store',
    body: JSON.stringify(payload),
    signal,
  });
  if (!res.ok) {
    const msg = await safeText(res);
    throw new Error(`addTransactionFE failed (${res.status}): ${msg}`);
  }
  const json = (await res.json()) as { ok: true; id: string };
  return json;
}

async function safeText(res: Response): Promise<string> {
  try {
    return await res.text();
  } catch {
    return '';
  }
}

export async function getRefundablesFE(
  clientId: string,
  year: number,
  signal?: AbortSignal
): Promise<RefundablesFE[]> {
  const url = `/api/v1/clients/${clientId}/transaction/refundables?year=${encodeURIComponent(
    String(year)
  )}`;

  const res = await fetch(url, { cache: 'no-store', signal });
  if (!res.ok) throw new Error(`Failed to fetch refundables (${res.status})`);

  const data = (await res.json()) as unknown[];

  const parsed: RefundablesFE[] = (Array.isArray(data) ? data : []).map(
    (r) => ({
      purchaseTransId: String((r as RefundablesFE).purchaseTransId),
      purchaseDate: String((r as RefundablesFE).purchaseDate),
      lineId: String((r as RefundablesFE).lineId),
      categoryId: String((r as RefundablesFE).categoryId),
      careItemSlug: String((r as RefundablesFE).careItemSlug),
      label:
        (r as RefundablesFE).label != null
          ? String((r as RefundablesFE).label)
          : undefined,
      originalAmount: Number((r as RefundablesFE).originalAmount ?? 0),
      refundedSoFar: Number((r as RefundablesFE).refundedSoFar ?? 0),
      remainingRefundable: Number(
        (r as RefundablesFE).remainingRefundable ?? 0
      ),
    })
  );

  return parsed;
}
