/**
 * Filename: /lib/care-item-helpers/date-helpers.ts
 * Author: Zahra Rizqita
 * Date Created: 24/09/2025
 * 
 * Functions to help with date for care items
 */

import {
    addDays,
    addWeeks,
    addMonths,
    addYears,
    differenceInCalendarDays,
} from "date-fns";

// to store dates as YYY-MM-DD
export function parseISODateOnly(yyyyMmDd: string): Date {
    const [y, m, d] = yyyyMmDd.split("-").map(Number);
    return new Date(Date.UTC(y, (m ?? 1) - 1, d ?? 1, 12, 0, 0));
}

export function formatISODateOnly(date: Date): string {
    return date.toISOString().slice(0, 10);
}

export type Unit = "day" | "week" | "month" | "year";

// add count and unit based on real months or years
export function addCount(ISO: string, count: number, unit: Unit): Date {
    const from = parseISODateOnly(ISO);
    switch(unit) {
        case "day": return addDays(from, count);
        case "week": return addWeeks(from, count);
        case "month": return addMonths(from, count);
        case "year": return addYears(from, count);
    }
}

// get the next due given date
export function nextDueISO(ISO: string, count: number, unit: Unit): string {
    const next = addCount(ISO, count, unit);
    return formatISODateOnly(next);
}

// Find exact for given interval of days
export function exactSpanDays(ISO: string, count: number, unit: Unit): number {
    const from = parseISODateOnly(ISO);
    const to = addCount(ISO, count, unit);
    return differenceInCalendarDays(to, from);
}

// Generate upcoming due dates starting from start date
export function generateDueDate(ISO: string, count: number, unit: Unit, n=6): string[] {
    const out: string[] = [];
    let cursor = ISO;
    for(let i=0; i<n; i++) {
        cursor = nextDueISO(cursor, count, unit);
        out.push(cursor);
    }
    return out;
}

export function toISO(input: unknown): string | undefined {
    if(!input) return undefined;
    const d = input instanceof Date? input : typeof input === "string"? new Date(input) : undefined;
    return d && !Number.isNaN(d.getTime())? d.toISOString() : undefined;
}