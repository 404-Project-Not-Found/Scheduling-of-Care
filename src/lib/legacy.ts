/**
 * Filename: /lib/legacy.ts
 * Author: Zahra Rizqita
 */

import type {Unit} from "./date-helper";

export function parseLegacyFrequency(freq?: string): {count:number; unit:Unit } | null {
    if(!freq) return null;
    const m = freq.trim().toLowerCase().match(/^(\d+)\s*(day|days|week|weeks|month|months|year|years)$/);
    if(!m) return null;
    const n = Math.max(1, parseInt(m[1], 10));
    const u = m[2].replace(/s$/, "") as Unit;
    return { count: n, unit: u};
}

