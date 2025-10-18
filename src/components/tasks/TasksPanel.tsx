'use client';

import type { Task } from '@/lib/mock/mockApi';
import { getNextDue } from '@/lib/care-item-helpers/date-helpers';

type StatusUI = 'Waiting Verification' | 'Completed' | 'Overdue' | 'Due' | 'Pending';

type TasksPanelProps = {
  tasks: Task[];
  onTaskClick: (task: Task) => void;

  /** Optional: exact day scope. If provided, it wins over year/month. */
  selectedDate?: string; // 'YYYY-MM-DD'
  /** Optional: month scope. Use together with `year`. 1..12 */
  month?: number;
  /** Optional: year scope. Example: 2025 */
  year?: number;
  /** Only show "no care items" message after the client is loaded */
  clientLoaded?: boolean;
  // Check if a task is marked as done
  onMarkDone?: (task: Task, fileName: string, comment?: string) => void;
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
const occurKey = (id?: string, due?: string) => `${id ?? ''}__${(due ?? '').slice(0, 10)}`


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
  tasks: Task[],
  selectedDate?: string,
  year?: number,
  month?: number
): Task[] {
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
  statusOverride
}: TasksPanelProps) {
  const scoped = filterByScope(tasks, selectedDate, year, month);
  const sorted = [...scoped].sort(
    (a, b) => new Date(a.nextDue).getTime() - new Date(b.nextDue).getTime()
  );

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
          const key = occurKey(t.id, t.nextDue);
          const displayStatus: StatusUI = statusOverride?.[key] ?? derivedOccurrenceStatus(t);

          return (
            <li
              key={`${t.id}-${t.nextDue ?? ''}`}
              className="w-full bg-white text-black border rounded px-3 py-2 cursor-pointer hover:bg-gray-100 flex justify-between items-center"
              onClick={() => onTaskClick(t)}
            >
              <div>
                <div className="font-bold">{t.label}</div>
                <p className="text-sm text-gray-700">
                  Scheduled due: {t.nextDue}
                </p>
              </div>
              <span
                className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(
                  displayStatus
                )}`}
              >
                {displayStatus}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
