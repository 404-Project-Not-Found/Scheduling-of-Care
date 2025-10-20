/**
 * Filename: /lib/budget-helpers.ts
 * Author: Zahra Rizqita
 * Date Created: 16/09/2025
 */

export type BudgetRow = {
  categoryId: string;
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
  openingCarryover?: number;
};

export type BudgetAlertPayload = {
  year: number;
  scope: 'category' | 'careItem';
  categoryName: string;
  careItemLabel?: string;
  remaining: number;
  planned: number;
};

export type CategoryItem = {
  careItemSlug: string;
  label: string;
  allocated: number;
  spent: number;
};

export type CategoryDetail = {
  categoryName: string;
  allocated: number;
  spent: number;
  items: CategoryItem[];
};

type CategoryApi = {
  _id: string;
  name: string;
  slug: string;
  aliases: string[];
  clientId: string;
  createdAt?: string;
  updatedAt?: string;
};

export type CategoryLite = { id: string; name: string };

/*--------------------------- functions ----------------------------------------- */

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
      categoryId: String((r as {categoryId: unknown}).categoryId ?? ''),
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
    openingCarryover: Number(data.openingCarryover ?? 0),
  };
}

export function openBudgetSSE(
  clientId: string,
  year: number,
  onChange: () => void
): () => void {
  const url = `/api/v1/clients/${clientId}/budget/stream?year=${encodeURIComponent(String(year))}`;

  const es = new EventSource(url);

  const handleChange = () => onChange();
  const handleError = (e: Event) => {
    try {es.close();} catch {}
  };

  es.addEventListener('change', handleChange);
  es.addEventListener('error', handleError);
  // es.addEventListener('ping', () => {});

  const cleanup = () => {
    es.removeEventListener('change', handleChange);
    es.removeEventListener('error', handleError);
    try{es.close();} catch{}
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

export async function getCategoryDetail(
  clientId: string,
  categoryId: string,
  year: number,
  signal?: AbortSignal
): Promise<CategoryDetail> {
  const url = `/api/v1/clients/${encodeURIComponent(
    clientId
  )}/budget/category/${encodeURIComponent(categoryId)}?year=${encodeURIComponent(
    String(year)
  )}`;
  const res = await fetch(url, { cache: 'no-store', signal });
  if (!res.ok) throw new Error(`fetchCategoryDetail failed (${res.status})`);
  const data = (await res.json()) as CategoryDetail;
  return {
    categoryName: String(data.categoryName ?? 'Category'),
    allocated: Number(data.allocated ?? 0),
    spent: Number(data.spent ?? 0),
    items: Array.isArray(data.items)
      ? data.items.map((it) => ({
          careItemSlug: String(it.careItemSlug),
          label: String(it.label ?? it.careItemSlug),
          allocated: Number(it.allocated ?? 0),
          spent: Number(it.spent ?? 0),
        }))
      : [],
  };
}

export async function setCategoryAllocation(
  clientId: string,
  year: number,
  categoryId: string,
  amount: number,
  categoryName?: string,
  signal?: AbortSignal
): Promise<void> {
  const res = await fetch(
    `/api/v1/clients/${encodeURIComponent(clientId)}/budget/manage`,
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store',
      body: JSON.stringify({
        action: 'setCategory',
        year,
        categoryId,
        amount,
        categoryName, // optional
      }),
      signal,
    }
  );
  if (!res.ok) throw new Error(`setCategoryAllocation failed (${res.status})`);
}

export async function setItemAllocation(
  clientId: string,
  year: number,
  categoryId: string,
  careItemSlug: string,
  amount: number,
  label?: string,
  signal?: AbortSignal
): Promise<void> {
  const res = await fetch(
    `/api/v1/clients/${encodeURIComponent(clientId)}/budget/manage`,
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store',
      body: JSON.stringify({
        action: 'setItem',
        year,
        categoryId,
        careItemSlug,
        amount,
        label, 
      }),
      signal,
    }
  );
  if (!res.ok) throw new Error(`setItemAllocation failed (${res.status})`);
}

export async function getBudgetCategories(
  clientId: string,
  year: number,
  signal?: AbortSignal
): Promise<CategoryLite[]> {
  const rows = await getBudgetRows(clientId, year, signal);
  const seen = new Map<string, CategoryLite>();
  rows.forEach((r) => {
    const key = r.category.toLowerCase();
    if (!seen.has(key)) {
      seen.set(key, { id: key, name: r.category });
    }
  });
  return [...seen.values()];
}

export async function getCategoriesForClient(
  clientId: string,
  signal?: AbortSignal,
  q?: string
): Promise<CategoryLite[]> {
  if (!clientId) return [];

  const qs = q ? `?q=${encodeURIComponent(q)}` : '';
  const url = `/api/v1/clients/${clientId}/category${qs}`;

  const res = await fetch(url, {
    method: 'GET',
    cache: 'no-store',
    signal,
    headers: { 'Content-Type': 'application/json' },
  });

  if (!res.ok) {
    const msg = await res.text().catch(() => '');
    throw new Error(msg || `Failed to fetch categories for client ${clientId}`);
  }

  const data = (await res.json()) as CategoryApi[];
  return (data ?? []).map((c) => ({ id: c._id, name: c.name }));
}