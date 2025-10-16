import {
  toISODateOnly,
  nextOccurrenceAfterToday,
  isISODateOnly,
  latestISO,
} from '@/lib/care-item-helpers/date-helpers';
import { type Unit } from '../mock/mockApi';


export type ApiCareItem = {
  slug: string;
  label: string;
  status: 'Pending' | 'Overdue' | 'Completed';
  frequency?: string;
  doneDates?: string[];
  nextDue?: string;
  clientId?: string;
  comments?: string[];
  files?: string[];
};

export type CareItemListRow = {
  label: string;
  slug: string;
  status: 'Pending' | 'Overdue' | 'Completed';
  category: string;
  categoryId?: string;
  clientId?: string;
  deleted?: boolean;
  frequency?: string;
  doneDates?: string[];
  frequencyDays?: number;
  frequencyCount?: number;
  frequencyUnit?: Unit;
  dateFrom?: string;
  dateTo?: string;
  notes?: string;
  comments?: string[];
  files?: string[]
};

const todayISO = () => new Date().toISOString().slice(0, 10);

function addCount(ISO: string, count: number, unit: Unit): string {
  const d = new Date(ISO + 'T00:00:00Z');
  switch (unit) {
    case 'day':   d.setUTCDate(d.getUTCDate() + count); break;
    case 'week':  d.setUTCDate(d.getUTCDate() + 7 * count); break;
    case 'month': d.setUTCMonth(d.getUTCMonth() + count); break;
    case 'year':  d.setUTCFullYear(d.getUTCFullYear() + count); break;
  }
  return d.toISOString().slice(0, 10);
}

// latest done task and frequency as fallback
export function doneNextDue(row: CareItemListRow) {
  const count = row.frequencyCount;
  const unit = row.frequencyUnit;
  if(!count || !unit) return '';

  const lastDone = isISODateOnly(latestISO(row.doneDates)) ? latestISO(row.doneDates) 
                : isISODateOnly(row.dateFrom) ? (row.dateFrom as string)
                : '';
  if(!lastDone) return '';

  const next = addCount(lastDone, count, unit);
  if(row.dateTo && next > row.dateTo) return '';
  return next;
}

export function frequencyLabel(row: CareItemListRow): string {
    if(row.frequency && row.frequency.trim()) return row.frequency;
    if(row.frequencyCount && row.frequencyUnit) {
        const c = row.frequencyCount;
        const u = row.frequencyUnit;
        return `${c} ${u}${c > 1 ? 's' : ''}`;
    }
    if(row.frequencyDays && row.frequencyDays > 0) {
        const d = row.frequencyDays;
        return `${d} day${d > 1 ? 's' : ''}`;
    }
    return '';
}

export function normalizeStatus(apiStatus: string | undefined, nextDue: string): 'Pending' | 'Overdue' | 'Completed' {
    const s = (apiStatus || '').toLowerCase();
    if(s === 'completed' || s === 'complete') return 'Completed';
    if(isISODateOnly(nextDue) && nextDue < todayISO()) return 'Overdue';
    return 'Pending';
}