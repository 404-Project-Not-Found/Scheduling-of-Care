/**
 * Filename: /lib/budget-helpers.ts
 * Author: Zahra Rizqita
 * Date Created: 16/09/2025
 */

export type BudgetRow = {
  item: string;
  category: string;
  allocated: number;
  spent: number;
};

export type BudgetSummary = {
  annualAllocated: number;
  spent: number;
  remaining: number;
  surplus: number;
};

export type BudgetAlertPayload = {
  year: number;
  scope: 'category' | 'careItem';
  categoryName: string;
  careItemLabel?: string;
  remaining: number;
  planned: number;
};

export async function getBudgetRows(
  clientId: string,
  year: number,
  signal?: AbortSignal
): Promise<BudgetRow[]> {
  const url = `/api/v1/clients/${encodeURIComponent(clientId)}/budget?year=${encodeURIComponent(
    String(year)
  )}`;
  const res = await fetch(url, { cache: 'no-store', signal });
  if (!res.ok) {
    throw new Error(`fetchBudgetRows failed (${res.status})`);
  }
  const data = (await res.json()) as unknown;
  if (!Array.isArray(data)) return [];
  return data
    .map((r) => ({
      item: String((r as { item: unknown }).item ?? ''),
      category: String((r as { category: unknown }).category ?? ''),
      allocated: Number((r as { allocated: unknown }).allocated ?? 0),
      spent: Number((r as { spent: unknown }).spent ?? 0),
    }))
    .filter((r) => r.category.length > 0);
}

export async function getBudgetSummary(
  clientId: string,
  year: number,
  signal?: AbortSignal
): Promise<BudgetSummary> {
  const url = `/api/v1/clients/${encodeURIComponent(
    clientId
  )}/budget/summary?year=${encodeURIComponent(String(year))}`;
  const res = await fetch(url, { cache: 'no-store', signal });
  if (!res.ok) throw new Error(`fetchBudgetSummary failed (${res.status})`);
  const data = (await res.json()) as Partial<BudgetSummary>;
  return {
    annualAllocated: Number(data.annualAllocated ?? 0),
    spent: Number(data.spent ?? 0),
    remaining: Number(data.remaining ?? 0),
    surplus: Number(data.surplus ?? 0),
  };
}

export function openBudgetSSE(
  clientId: string,
  year: number,
  onChange: () => void
): () => void {
  const url = `/api/v1/clients/${encodeURIComponent(
    clientId
  )}/budget/stream?year=${encodeURIComponent(String(year))}`;

  const es = new EventSource(url);

  const handleChange = () => onChange();
  es.addEventListener('change', handleChange);

  // es.addEventListener('ping', () => {});

  const cleanup = () => {
    es.removeEventListener('change', handleChange);
    es.close();
  };

  return cleanup;
}

export async function getAvailableYears(
  clientId: string,
  signal?: AbortSignal
): Promise<number[]> {
  const url = `/api/v1/clients/${encodeURIComponent(clientId)}/budget/years`;
  const res = await fetch(url, {cache: 'no-store', signal});
  if(!res.ok) throw new Error(`fetchAvailableYears failed (${res.status})`);
  const data = (await res.json()) as unknown;
  if(!Array.isArray(data)) return [];
  const years = data.map((y) => Number(y)).filter((y) => Number.isFinite(y));
  years.sort((a, b) => b - a);
  return years;
}

// TODO: Need to fix api first
export async function sendBudgetAlert(
  clientId: string,
  payload: BudgetAlertPayload,
  signal?: AbortSignal
): Promise<void> {
  const res = await fetch(
    `/api/v1/clients/${encodeURIComponent(clientId)}/budget/alerts`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store',
      body: JSON.stringify(payload),
      signal,
    }
  );
  if (!res.ok) {
    // eslint-disable-next-line no-console
    console.error('sendBudgetAlert failed', res.status, await res.text());
  }
}