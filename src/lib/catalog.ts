/**
 * Filename: /lib/catalog.ts
 * Author: Zahra Rizqita
 * Date Created:10/10/2025
 *
 * Helper function for Catalog -- frontend helper
 */

export type CareItemOption = { label: string; slug: string };

export async function fetchCareItemCatalog(
  category: string,
  clientId?: string
): Promise<CareItemOption[]> {
  const cat = category.trim();
  if (!cat) return [];
  if (!clientId) throw new Error('clientId required for catalog fetch');

  const url = new URL('/api/v1/task_catalog', window.location.origin);
  url.searchParams.set('category', cat);
  url.searchParams.set('clientId', clientId);

  const res = await fetch(url.toString(), { cache: 'no-store' });
  if (!res.ok) return [];
  const data: { category: string; tasks: CareItemOption[] } = await res.json();
  return Array.isArray(data.tasks) ? data.tasks : [];
}
