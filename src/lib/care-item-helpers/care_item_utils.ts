/**
 * Filename: /lib/care-item-helpers/care_item_utils.ts
 * Author: Zahra Rizqita
 * Date Created: 22/09/2025
 */

import { NextResponse } from 'next/server';
import { Unit, isUnit } from '@/models/CareItem';
import { isISODateOnly } from './date-helpers';
import { Types } from 'mongoose';
import { connectDB } from '../mongodb';
import CareItem from '@/models/CareItem';

// Days in a day and a week always same unlike a month and a year
const unitDayWeekSame: Record<Extract<Unit, 'day' | 'week'>, number> = {
  day: 1,
  week: 7,
};

type NormaliseInput = {
  frequency?: string;
  frequencyDays?: number;
  frequencyCount?: number;
  frequencyUnit?: Unit | string | null;
  dateFrom?: string;
  dateTo?: string;
  lastDone?: string;
} & Record<string, unknown>;

type NormalisedFields = {
  frequency?: string;
  frequencyDays?: number;
  frequencyCount?: number;
  frequencyUnit?: Unit;
  dateFrom?: string;
  dateTo?: string;
  lastDone?: string;
};

export type NewTask = {
  id: string;
  clientId: string; // which client this task belongs to
  title: string;
  category?: string; // optional: auto derived from catalog
  frequency: string;
  lastDone: string;
  nextDue: string; // YYYY-MM-DD
  status: 'Pending' | 'Overdue' | 'Completed';
  comments: string[];
  files: string[];
};

export function parseLegacyFrequency(
  freq?: string
): { count: number; unit: Unit } | null {
  if (!freq) return null;
  const m = freq
    .trim()
    .toLowerCase()
    .match(/^(\d+)\s*(day|days|week|weeks|month|months|year|years)$/);
  if (!m) return null;
  const n = Math.max(1, parseInt(m[1], 10));
  const u = m[2].replace(/s$/, '') as Unit;
  return { count: n, unit: u };
}

export function normaliseCareItemPayLoad(
  body: NormaliseInput
): NormalisedFields & Record<string, unknown> {
  let { frequencyCount, frequencyUnit, frequencyDays, frequency } = body;

  const { dateFrom, dateTo } = body;

  if (typeof frequencyCount === 'number' && frequencyUnit) {
    const unit = String(frequencyUnit).toLowerCase() as Unit;
    const count = Math.max(1, Math.floor(frequencyCount));

    if (unit === 'day' || unit === 'week') {
      frequencyDays = count * unitDayWeekSame[unit];
    } else {
      frequencyDays = undefined;
    }

    frequency = `${count} ${unit}${count > 1 ? 's' : ''}`;
    frequencyCount = count;
    frequencyUnit = unit;
  } else if (frequency) {
    const parsed = parseLegacyFrequency(frequency);
    if (parsed) {
      frequencyCount = parsed.count;
      frequencyUnit = parsed.unit;
      frequencyDays =
        parsed.unit === 'day'
          ? parsed.count
          : parsed.unit === 'week'
            ? parsed.count * 7
            : undefined;
    }
  } else if (typeof frequencyDays === 'number') {
    const count = Math.max(1, Math.floor(frequencyDays));
    frequencyCount = count;
    frequencyUnit = 'day';
    frequency = `${count} day${count > 1 ? 's' : ''}`;
  }

  return {
    ...body,
    frequencyCount: frequencyCount ?? undefined,
    frequencyUnit: isUnit(String(frequencyUnit))
      ? (String(frequencyUnit) as Unit)
      : undefined,
    frequencyDays: frequencyDays ?? undefined,
    frequency: frequency ?? undefined,
  };
}

export function errorJson(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export async function getCareItemForClient(
  clientId: string
): Promise<string[]> {
  await connectDB();

  if (!Types.ObjectId.isValid(clientId)) {
    throw new Error('Invalid clientId');
  }

  const items = await CareItem.find({
    clientId: new Types.ObjectId(clientId),
    deleted: { $ne: true },
  })
    .select({ _id: 1 })
    .lean();

  return items.map((i) => i.slug.toString());
}

export function addPeriodISO(iso: string, count: number, unit: 'day'|'week'|'month'|'year'): string {
  const d = new Date(iso + 'T00:00:00Z');
  if (unit === 'day') d.setUTCDate(d.getUTCDate() + count);
  else if (unit === 'week') d.setUTCDate(d.getUTCDate() + 7 * count);
  else if (unit === 'month') d.setUTCMonth(d.getUTCMonth() + count);
  else if (unit === 'year') d.setUTCFullYear(d.getUTCFullYear() + count);
  return d.toISOString().slice(0, 10);
}

export function lastScheduledOnOrBefore(
  startISO: string,
  count: number,
  unit: 'day'|'week'|'month'|'year',
  refISO: string
): string | null {
  if (!startISO) return null;
  let curr = startISO;
  if (curr > refISO) return null;
  const step = unit === 'day' ? 30 : unit === 'week' ? 26 : unit === 'month' ? 12 : 5;

  while (addPeriodISO(curr, count * step, unit) <= refISO) {
    curr = addPeriodISO(curr, count * step, unit);
  }

  let next = addPeriodISO(curr, count, unit);
  while (next <= refISO) {
    curr = next;
    next = addPeriodISO(curr, count, unit);
  }
  return curr;
}
