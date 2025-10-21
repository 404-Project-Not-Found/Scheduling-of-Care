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
} from 'date-fns';
import { Types } from 'mongoose';

interface CareItemLean {
  label: string;
  slug: string;
  status: string;
  category: string;
  frequency?: string;

  categoryId?: Types.ObjectId | string | null;
  deleted?: boolean;
  clientId?: Types.ObjectId | string | null;
  frequencyDays?: number | null;
  frequencyCount?: number | null;
  frequencyUnit?: Unit | null;
  dateFrom?: Date | string | null;
  dateTo?: Date | string | null;
  notes?: string | null;
}

export function isISODateOnly(s: unknown): s is string {
  return typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s);
}

// to store dates as YYY-MM-DD
export function parseISODateOnly(yyyyMmDd: string): Date {
  if (!isISODateOnly(yyyyMmDd)) {
    throw new Error(`parseISODateOnly: invalid format "${yyyyMmDd}"`);
  }
  const [ys, ms, ds] = yyyyMmDd.split('-');
  const y = Number(ys);
  const m = Number(ms);
  const d = Number(ds);
  if (!Number.isFinite(y) || !Number.isFinite(m) || !Number.isFinite(d)) {
    throw new Error(`parseISODateOnly: NaN components in "${yyyyMmDd}"`);
  }
  // Basic range checks
  if (m < 1 || m > 12 || d < 1 || d > 31) {
    throw new Error(`parseISODateOnly: out-of-range "${yyyyMmDd}"`);
  }

  const dt = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
  const roundTrip = formatISODateOnly(dt);
  if (roundTrip !== yyyyMmDd) {
    throw new Error(`parseISODateOnly: impossible date "${yyyyMmDd}"`);
  }
  return dt;
}

export function formatISODateOnly(date: Date | string | null): string {
  if (!date) return '';

  if (typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return date;
  }

  const d = new Date(date instanceof Date ? date : String(date));
  if (isNaN(d.getTime())) return '';

  return d.toISOString().slice(0, 10);
}

function toISODate(d: Date) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function cmpISO(a?: string, b?: string) {
  if (!a || !b) return 0;
  return a < b ? -1 : a > b ? 1 : 0;
}

function clampToWindow(date: string, start: string, end: string) {
  return !(date < start || date > end);
}

export type Unit = 'day' | 'week' | 'month' | 'year';

// add count and unit based on real months or years
export function addCount(ISO: string, count: number, unit: Unit): Date {
  const from = parseISODateOnly(ISO);
  switch (unit) {
    case 'day':
      return addDays(from, count);
    case 'week':
      return addWeeks(from, count);
    case 'month':
      return addMonths(from, count);
    case 'year':
      return addYears(from, count);
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
export function generateDueDate(
  ISO: string,
  count: number,
  unit: Unit,
  n = 6
): string[] {
  const out: string[] = [];
  let cursor = ISO;
  for (let i = 0; i < n; i++) {
    cursor = nextDueISO(cursor, count, unit);
    out.push(cursor);
  }
  return out;
}

export function toISO(input: unknown): string | undefined {
  if (!input) return undefined;
  const d =
    input instanceof Date
      ? input
      : typeof input === 'string'
        ? new Date(input)
        : undefined;
  return d && !Number.isNaN(d.getTime()) ? d.toISOString() : undefined;
}

export function latestISO(dates?: string[]): string | undefined {
  if (!Array.isArray(dates) || dates.length === 0) return undefined;
  const sorted = dates.slice().sort();
  return sorted[sorted.length - 1] ?? '';
}

export function futureOccurencesAfterLastDone(
  dateFrom: string | undefined,
  lastDone: string | undefined,
  count: number | undefined,
  unit: Unit | undefined,
  winStartISO: string,
  winEndISO: string,
  dateTo: string | null
) {
  if (!count || !unit) return [];
  const hasValid = (d?: string) =>
    !!d && /^\d{4}-\d{2}-\d{2}$/.test(d) && isISODateOnly(d);
  const startISO = hasValid(dateFrom) ? (dateFrom as string) : undefined;
  const lastISO = hasValid(lastDone) ? (lastDone as string) : undefined;
  const limitISO = hasValid(dateTo || undefined)
    ? (dateTo as string)
    : undefined;

  if (!startISO && !lastISO) return [];

  let firstOccur =
    lastISO && (!startISO || lastISO >= startISO)
      ? formatISODateOnly(addCount(lastISO, count, unit))
      : (startISO as string);

  if (!firstOccur || !isISODateOnly(firstOccur)) return [];

  const step = (iso: string) => formatISODateOnly(addCount(iso, count, unit));

  while (firstOccur < winStartISO) {
    const next = step(firstOccur);
    if (!next || next === firstOccur) return [];
    firstOccur = next;
    if (limitISO && firstOccur > limitISO) return [];
  }
  const out: string[] = [];
  let occur = firstOccur;
  let guard = 0;

  while (
    occur <= winEndISO &&
    (!limitISO || occur <= limitISO) &&
    guard < 2048
  ) {
    out.push(occur);
    const next = step(occur);
    if (!next || next === occur) break;
    occur = next;
    guard++;
  }

  return out;
}

export function toISODateOnly(
  input: Date | string | number | null | undefined
): string {
  if (input == null) return '';

  if (input instanceof Date && !Number.isNaN(input.getTime())) {
    return formatISODateOnly(input);
  }

  if (typeof input === 'number') {
    const d = new Date(input);
    return Number.isNaN(d.getTime()) ? '' : formatISODateOnly(d);
  }

  if (typeof input === 'string') {
    if (isISODateOnly(input)) return input;
    const d = new Date(input);
    return Number.isNaN(d.getTime()) ? '' : formatISODateOnly(d);
  }
  return '';
}

export function getNextDue(
  start: string,
  count?: number | null,
  unit?: Unit | null,
  frequencyDays?: number | null
): string {
  const startISO = toISODateOnly(start);
  if (!startISO) return '';

  const step =
    count && count > 0 && unit
      ? (iso: string) => nextDueISO(iso, count, unit)
      : frequencyDays && frequencyDays > 0
        ? (iso: string) => toISODateOnly(addCount(iso, frequencyDays, 'day'))
        : null;

  if (!step) return '';

  return step(startISO);
}
