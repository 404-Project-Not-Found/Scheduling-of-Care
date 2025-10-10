/**
 * Filename: /lib/catalog.ts
 * Author: Zahra Rizqita
 * Date Created:10/10/2025
 * 
 * Helper function for Catalog -- frontend helper
 */

export type CareItemOption = { label: string; slug: string };

export async function fetchCareItemCatalog(category: string): Promise<CareItemOption[]> {
    if(!category.trim()) return [];
    const res = await fetch(`/api/v1/task_catalog?category=${encodeURIComponent(category)}`, { cache: "no-store" });
    if(!res.ok) return [];
    const data: {category: string; tasks: CareItemOption[]} = await res.json();
    return Array.isArray(data.tasks) ? data.tasks : [];
}
