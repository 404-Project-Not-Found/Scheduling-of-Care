/**
 * Filename: /lib/slug.ts
 * Author: Zahra Rizqita
 * Date Created: 03/10/2025
 */
 
export function slugify(s: string) {
    return s.trim().toLowerCase().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-");
}