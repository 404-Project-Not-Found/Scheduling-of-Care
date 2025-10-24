/*
 * Last Updated by Denise Alexander (24/10/2025): added an arrow to indicate tasks are clickable
 * as per UE feedback.
 */

'use client';

import { ArrowRight } from 'lucide-react';
import type { Task } from '@/lib/mock/mockApi';
import { getNextDue } from '@/lib/care-item-helpers/date-helpers';
import { ClientTask } from '@/app/calendar_dashboard/page';

type StatusUI =
  | 'Waiting Verification'
  | 'Completed'
  | 'Overdue'
  | 'Due'
  | 'Pending';

type MaybeSlugTask = Task & { slug?: string };

type TasksPanelProps = {
  tasks: ClientTask[];
  onTaskClick: (task: ClientTask) => void;
  /** Optional: exact day scope. If provided, it wins over year/month. */
  selectedDate?: string; // 'YYYY-MM-DD'
  /** Optional: month scope. Use together with `year`. 1..12 */
  month?: number;
  /** Optional: year scope. Example: 2025 */
  year?: number;
  /** Only show "no care items" message after the client is loaded */
  clientLoaded?: boolean;
  // Check if a task is marked as done
  onMarkDone?: (task: ClientTask, fileName: string, comment?: string) => void;
  // UI override, map task to date with status
  statusOverride?: Record<string, StatusUI>;
};

// Map status → pill colors (kept exactly like your original visuals)
const getStatusColor = (status: string) => {
  switch ((status || '').toLowerCase()) {
    case 'waiting verification':
      return 'bg-yellow-400 text-white';
    case 'overdue':
      return 'bg-red-500 text-white';
    case 'due':
      return 'bg-orange-400 text-white';
    case 'completed':
      return 'bg-green-500 text-white';
    default:
      return 'bg-gray-300 text-black';
  }
};

// Helpers
const pad2 = (n: number) => String(n).padStart(2, '0');
const isoToday = () => new Date().toISOString().slice(0, 10);
type WithOptionalSlug = { id: string; slug?: string };
const getSlug = (t: ClientTask): string => t.slug ?? t.id;
const occurKey = (slugOrId: string, due?: string) =>
  `${slugOrId}__${(due ?? '').slice(0, 10)}`;

function derivedOccurrenceStatus(t: {
  status?: string;
  nextDue?: string;
}): StatusUI {
  const due = t.nextDue?.slice(0, 10) ?? '';
  if (!due) return 'Due';

  const today = isoToday();
  if (due < today) return 'Overdue';
  if (due === today) return 'Due';
  return 'Due';
}

/**
 * Filters tasks by scope:
 * - If `selectedDate` is given -> same-day only.
 * - Else if `year` + `month` are given -> same month.
 * - Else -> no extra filtering (use the `tasks` as-is).
 */
function filterByScope(
  tasks: ClientTask[],
  selectedDate?: string,
  year?: number,
  month?: number
): ClientTask[] {
  if (selectedDate) {
    return tasks.filter((t) => (t.nextDue || '') === selectedDate);
  }
  if (year && month) {
    const prefix = `${year}-${pad2(month)}-`; // e.g. "2025-10-"
    return tasks.filter((t) => (t.nextDue || '').startsWith(prefix));
  }
  return tasks;
}

export default function TasksPanel({
  tasks = [],
  onTaskClick,
  selectedDate,
  year,
  month,
  clientLoaded,
  statusOverride,
}: TasksPanelProps) {
  const scoped = filterByScope(tasks, selectedDate, year, month);
  const sorted = [...scoped].sort((a, b) => {
    const ta = a.nextDue ? new Date(a.nextDue).getTime() : 0;
    const tb = b.nextDue ? new Date(b.nextDue).getTime() : 0;
    return ta - tb;
  });

  // ➜ derive "today" once
  const todayStr = new Date().toISOString().slice(0, 10);

  return (
    <div className="h-full flex flex-col">
      {sorted.length === 0 && clientLoaded && clientLoaded && (
        <div className="text-sm text-gray-600 italic pb-2">
          No care items for the selected month and year.
        </div>
      )}

      <ul className="space-y-3">
        {sorted.map((t) => {
          const key = occurKey(getSlug(t), t.nextDue);
          const displayStatus: StatusUI =
            statusOverride?.[key] ?? derivedOccurrenceStatus(t);

          return (
            <li
              key={`${getSlug(t)}-${t.nextDue ?? ''}`}
              className="w-full bg-white text-black border rounded px-3 py-2 cursor-pointer hover:bg-gray-100 flex justify-between items-center"
              onClick={() => onTaskClick(t)}
            >
              <div>
                <div className="font-bold">{t.label}</div>
                <p className="text-sm text-gray-700">
                  Scheduled due: {t.nextDue}
                </p>
                <span
                  className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(
                    displayStatus
                  )}`}
                >
                  {displayStatus}
                </span>
              </div>
              <ArrowRight size={22} strokeWidth={2.5} />
            </li>
          );
        })}
      </ul>
    </div>
  );
}
