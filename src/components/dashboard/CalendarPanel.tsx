'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import type {
  CalendarApi,
  DatesSetArg,
  DateClickArg,
  EventClickArg,
  EventContentArg,
  DayCellContentArg,
} from '@fullcalendar/core';
import '@/styles/fullcalendar.css';

// Load FullCalendar on the client only
const FullCalendar = dynamic(() => import('@fullcalendar/react'), {
  ssr: false,
});

/** Unified status type used by the calendar coloring. */
export type StatusUI =
  | 'Waiting Verification'
  | 'Completed'
  | 'Overdue'
  | 'Due'
  | 'Pending';

export type Task = {
  id: string;
  title?: string; // preferred
  label?: string; // legacy/alternative field
  nextDue: string; // 'YYYY-MM-DD'
  endExclusive?: string;
  status?: string; // optional raw status from backend (any casing)
};

type CalendarPanelProps = {
  tasks: Task[];
  /** Parent should filter TasksPanel by this date string. Pass '' to clear. */
  onDateClick: (date: string) => void;
  onMonthYearChange?: (year: number, month: number) => void;
  debug?: boolean;
};

/** Format Date → 'YYYY-MM-DD' */
function yyyymmdd(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
}

/** Add one day to a YYYY-MM-DD string (used for end-exclusive ranges) */
function addOneDay(ymd: string): string {
  const d = new Date(`${ymd}T00:00:00`);
  d.setDate(d.getDate() + 1);
  return yyyymmdd(d);
}

/** Robust status normalization (tolerates snake/kebab/varied casing). */
function normalizeStatus(raw?: string): StatusUI | undefined {
  if (!raw) return undefined;
  const s = raw.trim().toLowerCase().replace(/[_-]+/g, ' ');
  if (/\bwaiting\b|\bverify|\bverification/.test(s))
    return 'Waiting Verification';
  if (/\boverdue\b/.test(s)) return 'Overdue';
  if (/\bcomplete(d)?\b/.test(s)) return 'Completed';
  if (/\bpending\b/.test(s)) return 'Pending';
  // keep 'due' last so 'overdue' isn't swallowed by 'due'
  if (/\bdue\b/.test(s)) return 'Due';
  return undefined;
}

/** Fallback when no status is provided: derive by date (future => Pending). */
function deriveStatusByDate(nextDue: string): StatusUI {
  const today = yyyymmdd(new Date());
  if (!nextDue) return 'Pending';
  if (nextDue < today) return 'Overdue';
  if (nextDue === today) return 'Due';
  return 'Pending';
}

/** Map StatusUI → a CSS class that controls colors */
function statusToClass(status: StatusUI): string {
  switch (status) {
    case 'Waiting Verification':
      return 'task-waiting';
    case 'Overdue':
      return 'task-overdue';
    case 'Due':
      return 'task-due';
    case 'Completed':
      return 'task-completed';
    case 'Pending':
      return 'task-pending';
    default:
      return 'task-default';
  }
}

export default function CalendarPanel(props: CalendarPanelProps) {
  const { tasks = [], onDateClick, onMonthYearChange, debug = false } = props;

  const rootRef = useRef<HTMLDivElement | null>(null);
  const apiRef = useRef<CalendarApi | null>(null);

  // Visible month (driven by FullCalendar)
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [month, setMonth] = useState<number>(new Date().getMonth() + 1); // 1..12

  // Month/Year picker popover state
  const [openPicker, setOpenPicker] = useState<boolean>(false);

  // Icon position next to the toolbar title
  const [iconPos, setIconPos] = useState<{ top: number; left: number }>({
    top: 0,
    left: 0,
  });

  /** Mark days that have at least one task (to tint the cell). */
  const taskDates = useMemo(
    () =>
      new Set(
        tasks.flatMap((t) => {
          const start = t.nextDue;
          const endEx = t.endExclusive ?? addOneDay(t.nextDue);
          const days: string[] = [];
          const cur = new Date(`${start}T00:00:00`);
          const end = new Date(`${endEx}T00:00:00`);
          while (cur < end) {
            days.push(yyyymmdd(cur));
            cur.setDate(cur.getDate() + 1);
          }
          return days;
        })
      ),
    [tasks]
  );

  /**
   * Normalize tasks → FullCalendar events.
   * - Title fallback: title → label → 'Untitled'
   * - Status: prefer backend status; otherwise derive by date
   * - Class names: include base 'task-grid' + status color class
   */
  const events = useMemo(() => {
    const evts = tasks.map((t) => {
      const normalizedTitle = (t.title ?? t.label ?? 'Untitled').toString();
      const resolvedStatus: StatusUI =
        normalizeStatus(t.status) ?? deriveStatusByDate(t.nextDue);
      const colorClass = statusToClass(resolvedStatus);

      const evt = {
        id: t.id,
        title: normalizedTitle,
        start: t.nextDue,
        end: t.endExclusive ?? addOneDay(t.nextDue),
        allDay: true,
        classNames: ['task-grid', colorClass],
      };

      if (debug) {
        console.log('[Calendar event]', {
          id: t.id,
          nextDue: t.nextDue,
          rawStatus: t.status,
          resolvedStatus,
          classNames: evt.classNames,
        });
      }

      return evt;
    });
    return evts;
  }, [tasks, debug]);

  const months = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];

  // Year dropdown options centered on current visible year
  const yearOptions = useMemo(() => {
    const base = year || new Date().getFullYear();
    const arr: number[] = [];
    for (let y = base - 6; y <= base + 6; y += 1) arr.push(y);
    return arr;
  }, [year]);

  /** Programmatically go to year/month (month is 1..12). */
  const goto = (y: number, m: number) => {
    if (apiRef.current) {
      apiRef.current.gotoDate(new Date(y, m - 1, 1));
    }
  };

  /** Place the month/year icon next to the toolbar title. */
  const positionIconNextToTitle = () => {
    const root = rootRef.current;
    if (!root) return;
    const title = root.querySelector('.fc-toolbar-title') as HTMLElement | null;
    if (!title) return;

    const hostBox = root.getBoundingClientRect();
    const tBox = title.getBoundingClientRect();

    setIconPos({
      top: tBox.top - hostBox.top + tBox.height / 2,
      left: tBox.right - hostBox.left + 8,
    });
  };

  /** Sync visible month/year after each view change. */
  const onDatesSet = (arg: DatesSetArg) => {
    apiRef.current = arg.view.calendar;
    const cur = arg.view.calendar.getDate();
    const y = cur.getFullYear();
    const m = cur.getMonth() + 1;
    setYear(y);
    setMonth(m);
    onMonthYearChange?.(y, m);
    setTimeout(positionIconNextToTitle, 0);
  };

  useEffect(() => {
    const onResize = () => positionIconNextToTitle();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    if (!openPicker) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpenPicker(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [openPicker]);

  const todayStr = yyyymmdd(new Date());

  return (
    <div ref={rootRef} className="relative">
      {/* Month/Year picker trigger (small icon near title) */}
      <button
        type="button"
        aria-label="Pick month and year"
        onClick={() => setOpenPicker((v) => !v)}
        className="absolute z-10 -translate-y-1/2 p-1 hover:bg-black/5 rounded"
        style={{
          top: iconPos.top,
          left: iconPos.left,
          background: 'transparent',
        }}
        title="Pick month & year"
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
        >
          <rect
            x="3"
            y="4"
            width="18"
            height="17"
            rx="2"
            stroke="#3A0000"
            strokeWidth="2"
          />
          <path
            d="M8 2v4M16 2v4M3 9h18"
            stroke="#3A0000"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      </button>

      <FullCalendar
        plugins={[dayGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        headerToolbar={{ left: 'prev', center: 'title', right: 'next' }}
        /** Never fold events into "+X more" */
        dayMaxEventRows={false}
        expandRows={true}
        height="auto"
        events={events}
        eventDisplay="block"
        eventClassNames={(arg) => arg.event.classNames}
        /** Clicking a day → tell parent to show that day's tasks in TasksPanel */
        dateClick={(info: DateClickArg) => {
          const d = yyyymmdd(info.date);
          onDateClick(d);
        }}
        /** Clicking an event → same behavior (filter by its start date) */
        eventClick={(info: EventClickArg) => {
          // FullCalendar passes a Date in local tz; convert to 'YYYY-MM-DD'
          const start: Date = info.event.start!;
          onDateClick(yyyymmdd(start));
        }}
        /** Lightweight custom content (lets your CSS truncation apply) */
        eventContent={(arg) => {
          const safe = String(arg.event.title ?? 'Untitled');
          return { html: `<span class="task-grid-title">${safe}</span>` };
        }}
        datesSet={onDatesSet}
        /** Add cell classes for today / days that have tasks (for subtle tint) */
        dayCellClassNames={(info: DayCellContentArg) => {
          const d = yyyymmdd(info.date);
          const cls: string[] = [];
          if (d === todayStr) cls.push('fc-today-custom');
          if (taskDates.has(d)) cls.push('fc-task-day');
          return cls;
        }}
        fixedWeekCount={false}
        showNonCurrentDates={false}
      />

      {/* Month/Year picker popover */}
      {openPicker && (
        <div
          className="absolute z-20 rounded-lg bg-white shadow p-2"
          style={{ top: iconPos.top + 14, left: iconPos.left }}
        >
          <div className="flex items-center gap-2">
            <select
              aria-label="Select month"
              className="rounded px-2 py-1 border"
              value={month}
              onChange={(e) => {
                const m = parseInt(e.target.value, 10);
                goto(year, m);
                setOpenPicker(false);
              }}
            >
              {months.map((label, idx) => (
                <option key={label} value={idx + 1}>
                  {label}
                </option>
              ))}
            </select>

            <select
              aria-label="Select year"
              className="rounded px-2 py-1 border"
              value={year}
              onChange={(e) => {
                const y = parseInt(e.target.value, 10);
                goto(y, month);
                setOpenPicker(false);
              }}
            >
              {yearOptions.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>

            <button
              type="button"
              aria-label="Close picker"
              onClick={() => setOpenPicker(false)}
              className="ml-1 px-2 py-1 rounded hover:bg-gray-100"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
