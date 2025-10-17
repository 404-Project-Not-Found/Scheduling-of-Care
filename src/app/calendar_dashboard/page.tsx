/**
 * Calendar Dashboard (Schedule)
 * Frontend Authors: Vanessa Teo & Devni Wijesinghe & Qingyue Zhao
 * ------------------------------------------------------------
 * - Uses the shared <DashboardChrome /> for the top chrome.
 * - Client selection persists via localStorage helpers.
 * - Right column now has a name filter placed on the same row
 *   as the "Care Items" title, aligned to the RIGHT.
 * - The search filters tasks by title only (case-insensitive).
 *
 * Updated by Denise Alexander - 7/10/2025: back-end integrated for
 * fetching user role and clients.
 *
 * Last Updated by Qingyue Zhao - 8/10/2025:
 * - The calendar title (month/year) drives the right-pane title:
 *   * When a day is selected -> "Care items on YYYY-MM-DD"
 *   * Otherwise -> "All care items in <Month Year>"
 * - TasksPanel receives either `selectedDate` or `year`+`month` to filter items,
 *  add a dropdown of list of users with access to the selected client
 */

'use client';

import React, { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

import DashboardChrome from '@/components/top_menu/client_schedule';
import CalendarPanel from '@/components/dashboard/CalendarPanel';
import TasksPanel from '@/components/tasks/TasksPanel';
import {
  futureOccurencesAfterLastDone,
  getNextDue,
} from '@/lib/care-item-helpers/date-helpers';

import type { Task } from '@/lib/mock/mockApi';

import {
  getViewerRole,
  getTasks,
  saveTasks,
  getClients,
  getActiveClient,
  setActiveClient,
  type Client as ApiClient,
} from '@/lib/data';

import { title } from 'node:process';

/* ------------------------------ Palette ----------------------------- */
const palette = {
  header: '#3A0000',
  banner: 'rgba(249, 201, 177, 0.7)',
  text: '#2b2b2b',
  pageBg: '#FAEBDC',
};

// --------- Type Definitions ---------
type Role = 'carer' | 'family' | 'management';

type ClientLite = {
  id: string;
  name: string;
  orgAccess?: 'approved' | 'pending' | 'revoked';
};

type ApiClientWithAccess = ApiClient & {
  orgAccess?: 'approved' | 'pending' | 'revoked';
};

// Extends Task type to safely access clientId, files and comments
type ClientTask = Task & {
  clientId?: string;
  comments?: string[];
  files?: string[];

  // added for task occurences
  dateFrom?: string;
  dateTo?: string;
  frequencyCount?: number;
  frequencyUnit?: 'day' | 'week' | 'month' | 'year';
  lastDone: string;
  frequencyDays?: number;
};

// Type status
type StatusUI =
  | 'Waiting Verification'
  | 'Completed'
  | 'Overdue'
  | 'Due'
  | 'Pending';

/* ---------------------------- Main Page ----------------------------- */
type CalendarPanelProps = {
  tasks: Task[];
  onDateClick?: (date: string) => void;
  onMonthYearChange?: (year: number, month: number) => void;
};

export default function Page() {
  return (
    <Suspense fallback={<div className="p-6 text-gray-500">Loading…</div>}>
      <ClientSchedule />
    </Suspense>
  );
}

function ClientSchedule() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const addedFile = searchParams.get('addedFile');

  /* ------------------------------ Role ------------------------------ */
  const [role, setRole] = useState<Role>('carer'); // default

  useEffect(() => {
    (async () => {
      try {
        const r = await getViewerRole();
        setRole(r);
      } catch (err) {
        console.error('Failed to get role.', err);
        setRole('carer'); // fallback
      }
    })();
  }, []);

  /* ---------------------------- Clients ----------------------------- */
  const [clients, setClients] = useState<ClientLite[]>([]);
  const [activeClientId, setActiveClientId] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState<string>('');

  // Load clients + active client on mount
  useEffect(() => {
    (async () => {
      try {
        const list: ApiClient[] = await getClients();
        const mapped: ClientLite[] = (list as ApiClientWithAccess[]).map(
          (c) => ({
            id: c._id,
            name: c.name,
            orgAccess: c.orgAccess,
          })
        );
        setClients(mapped);

        const active = await getActiveClient();
        setActiveClientId(active.id);
        setDisplayName(active.name || '');
      } catch (err) {
        console.error('Failed to fetch clients.', err);
        setClients([]);
        setActiveClientId(null);
        setDisplayName('');
      }
    })();
  }, []);

  // Change active client (persists with helper)
  const onClientChange = async (id: string) => {
    if (!id) {
      setActiveClientId(null);
      setDisplayName('');
      await setActiveClient(null);
      return;
    }
    const c = clients.find((x) => x.id === id);
    const name = c?.name || '';
    setActiveClientId(id);
    setDisplayName(name);
    await setActiveClient(id, name);
  };

  /* ------------------------------ Tasks ----------------------------- */
  const [selectedDate, setSelectedDate] = useState('');
  const [tasks, setTasks] = useState<ClientTask[]>([]);
  const [selectedTask, setSelectedTask] = useState<ClientTask | null>(null);

  const [isAddingComment, setIsAddingComment] = useState(false);
  const [newComment, setNewComment] = useState('');

  // Load tasks
  useEffect(() => {
    (async () => {
      try {
        const list: Task[] = await getTasks();
        setTasks(Array.isArray(list) ? list : []);
      } catch (err) {
        console.error('Failed to fetch tasks.', err);
        setTasks([]);
      }
    })();
  }, []);

  // Persist changes (mock FE storage)
  useEffect(() => {
    if (!tasks) return;
    (async () => {
      try {
        await saveTasks(tasks);
      } catch (err) {
        console.error('Failed to save tasks', err);
      }
    })();
  }, [tasks]);

  // Attach a file via query (?addedFile=...) for carer role
  const hasAddedFile = useRef(false);
  useEffect(() => {
    if (role !== 'carer') return;
    if (addedFile && selectedTask && !hasAddedFile.current) {
      addFile(selectedTask.id, addedFile);
      hasAddedFile.current = true;
    }
  }, [addedFile, selectedTask, role]);

  /* --------------- Derived: filter by client and date --------------- */
  // These are set whenever the calendar view (brown title) changes.
  const [visibleYear, setVisibleYear] = useState<number | null>(null); // e.g. 2025
  const [visibleMonth, setVisibleMonth] = useState<number | null>(null); // 1..12

  const noClientSelected = !activeClientId;

  const tasksByClient: ClientTask[] = activeClientId
    ? tasks.filter(
        (t): t is ClientTask => (t.clientId ?? '') === activeClientId
      )
    : [];

  function monthBoundsUTC(yyyyMm: string) {
    const [ys, ms] = yyyyMm.split('-');
    const y = Number(ys),
      m = Number(ms);
    const first = new Date(Date.UTC(y, m - 1, 1));
    const last = new Date(Date.UTC(y, m, 0));
    const iso = (d: Date) => d.toISOString().slice(0, 10);
    return { start: iso(first), end: iso(last) };
  }

  const visibleMonthStr =
    visibleYear && visibleMonth
      ? `${visibleYear}-${String(visibleMonth).padStart(2, '0')}`
      : new Date().toISOString().slice(0, 7);

  const { start: monthStart, end: monthEnd } = monthBoundsUTC(visibleMonthStr);

  const windowStart = selectedDate || monthStart;
  const windowEnd = selectedDate || monthEnd;

  // Completion-driven using lastDone
  const tasksForCalendar: ClientTask[] = tasksByClient.flatMap((t) => {
    const count = t.frequencyCount ?? 0;
    const unit = t.frequencyUnit as
      | 'day'
      | 'week'
      | 'month'
      | 'year'
      | undefined;
    if (!count || !unit) return [];

    const occs = futureOccurencesAfterLastDone(
      t.dateFrom,
      t.lastDone,
      count,
      unit,
      windowStart,
      windowEnd,
      t.dateTo ?? null
    );

    return occs.map((d) => ({ ...t, nextDue: d }));
  });

  // If a day is selected we filter by that day; otherwise it's the whole dataset for the visible month (handled in TasksPanel)
  const filteredTasks = selectedDate
    ? tasksByClient.filter((t) => t.nextDue === selectedDate)
    : tasksByClient;

  /* ------------- Visible month/year coming from Calendar ------------- */
  const MONTH_NAMES = useMemo(
    () => [
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
    ],
    []
  );

  // Title rule:
  // - If a day is selected -> "Care items on YYYY-MM-DD"
  // - Else if we know the current calendar month -> "All care items in <Month Year>"
  // - Fallback -> "Care Items"
  const titleParts = useMemo(() => {
    // When a day is selected -> 2-line title: "Care items" + "on YYYY-MM-DD"
    if (selectedDate) {
      return { main: 'Care items', sub: `on ${selectedDate}` };
    }
    // Otherwise -> month scope: "All care items" + "in <Month Year>"
    if (visibleYear && visibleMonth) {
      return {
        main: 'All care items',
        sub: `in ${MONTH_NAMES[visibleMonth - 1]} ${visibleYear}`,
      };
    }
    // Fallback
    return { main: 'Care Items', sub: '' };
  }, [selectedDate, visibleYear, visibleMonth, MONTH_NAMES]);

  /* -------------------- RIGHT PANE: title search -------------------- */
  const [searchTerm, setSearchTerm] = useState('');
  const tasksForRightPane = tasksForCalendar.filter((t) => {
    const title = (t?.label ?? '').toLowerCase();
    const q = (searchTerm ?? '').trim().toLowerCase();
    return title.includes(q);
  });

  /* ----------------------------- Actions ---------------------------- */
  const addComment = (taskId: string, comment: string) => {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? { ...t, comments: [...(t.comments || []), comment] }
          : t
      )
    );
    setSelectedTask((prev) =>
      prev ? { ...prev, comments: [...(prev.comments || []), comment] } : prev
    );
    setNewComment('');
    setIsAddingComment(false);
  };

  const addFile = (taskId: string, fileName: string) => {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId ? { ...t, files: [...(t.files || []), fileName] } : t
      )
    );
    setSelectedTask((prev) =>
      prev ? { ...prev, files: [...(prev.files || []), fileName] } : prev
    );
  };

  const getStatusBadgeClasses = (status?: string) => {
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

  async function markTaskDone(
    task: ClientTask,
    fileName: string,
    comment?: string
  ) {
    const slug = task.id;
    const doneAt = task.nextDue;

    if (!doneAt) {
      alert('No occurrence date found for this task.');
      return;
    }
    if (!fileName) {
      alert('Upload a file before marking as done.');
      return;
    }

    const res = await fetch(
      `/api/v1/care_item/${encodeURIComponent(slug)}/done`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          file: fileName,
          comment: comment || '',
          doneAt,
        }),
      }
    );

    if (!res.ok) {
      alert('Failed to mark as done.');
      return;
    }

    const updated = await res.json();

    // Update the base task in list state
    setTasks((prev: ClientTask[]) =>
      prev.map((t) => {
        if (t.id !== slug) return t;

        const freqCount = t.frequencyCount ?? null;
        const freqUnit = t.frequencyUnit ?? null;
        const freqDays = t.frequencyDays ?? null;

        return {
          ...t,
          lastDone: updated.lastDone ?? doneAt,
          files: Array.isArray(updated.files) ? updated.files : t.files,
          comments: Array.isArray(updated.comments)
            ? updated.comments
            : t.comments,
          nextDue: getNextDue(
            updated.lastDone ?? doneAt,
            freqCount,
            freqUnit,
            freqDays
          ),
        };
      })
    );
  }

  // Logo → home
  const onLogoClick = () => {
    router.push('/icon_dashboard');
  };

  return (
    <DashboardChrome
      page="client-schedule"
      clients={clients}
      onClientChange={onClientChange}
      colors={{
        header: palette.header,
        banner: palette.banner,
        text: palette.text,
      }}
      onLogoClick={onLogoClick}
    >
      {/* Two-column layout; left calendar, right task list/detail */}
      <div className="flex flex-1 h-[680px]">
        {/* LEFT: Calendar */}
        <section className="flex-1 bg-white overflow-auto p-4">
          <CalendarPanel
            tasks={tasksForCalendar}
            onDateClick={(date: string) => setSelectedDate(date)}
            onMonthYearChange={(year: number, month: number) => {
              setVisibleYear(year);
              setVisibleMonth(month);
            }}
          />
        </section>

        {/* RIGHT: Tasks */}
        <section
          className="flex-1 overflow-auto"
          style={{ backgroundColor: palette.pageBg }}
        >
          {!selectedTask ? (
            <>
              {/* Title row */}
              <div className="px-6 py-10 flex flex-col gap-4">
                <div className="flex items-center justify-between gap-4">
                  <h2 className="leading-tight">
                    {/* First line (big) */}
                    <span className="block text-3xl md:text-4xl font-extrabold">
                      {titleParts.main}
                    </span>
                    {/* Second line (smaller) */}
                    {titleParts.sub && (
                      <span className="block text-lg md:text-lg font-semibold text-black/70">
                        {titleParts.sub}
                      </span>
                    )}
                  </h2>
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search care items"
                    className="h-11 w-full max-w-[320px] rounded-lg border px-4 text-black bg-white focus:outline-none focus:ring-2 focus:ring-[#F9C9B1]"
                  />
                </div>
                {noClientSelected && (
                  <p className="text-lg">Loading client&apos;s care items...</p>
                )}
              </div>

              {/* Task list */}
              <div className="px-6 pb-8">
                <TasksPanel
                  tasks={tasksForRightPane}
                  onTaskClick={(task) => setSelectedTask(task)}
                  selectedDate={selectedDate || undefined}
                  year={visibleYear ?? undefined}
                  month={visibleMonth ?? undefined}
                  clientLoaded={!noClientSelected}
                  onMarkDone={markTaskDone}
                />
              </div>
            </>
          ) : (
            <TaskDetail
              role={role}
              task={selectedTask}
              setTasks={setTasks}
              setSelectedTask={setSelectedTask}
              addComment={addComment}
              addFile={addFile}
              getStatusBadgeClasses={getStatusBadgeClasses}
              newComment={newComment}
              setNewComment={setNewComment}
              isAddingComment={isAddingComment}
              setIsAddingComment={setIsAddingComment}
            />
          )}
        </section>
      </div>
    </DashboardChrome>
  );
}

/* ---------------------- Right column: Task details ------------------- */
function isoToday(): string {
  return new Date().toISOString().slice(0, 10);
}

function derivedOccurrenceStatus(t: {
  status?: string;
  nextDue?: string;
}): StatusUI {
  if ((t.status || '').toLowerCase() === 'waiting verification')
    return 'Waiting Verification';

  const due = t.nextDue?.slice(0, 10) ?? '';
  if (!due) return 'Due';

  const today = isoToday();
  if (due < today) return 'Overdue';
  if (due === today) return 'Due';
  return 'Due';
}

function TaskDetail({
  role,
  task,
  setTasks,
  setSelectedTask,
  addComment,
  addFile,
  getStatusBadgeClasses,
  newComment,
  setNewComment,
  isAddingComment,
  setIsAddingComment,
}: {
  role: 'carer' | 'family' | 'management';
  task: Task;
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  setSelectedTask: React.Dispatch<React.SetStateAction<Task | null>>;
  addComment: (taskId: string, comment: string) => void;
  addFile: (taskId: string, fileName: string) => void;
  getStatusBadgeClasses: (status: string | undefined) => string;
  newComment: string;
  setNewComment: (v: string) => void;
  isAddingComment: boolean;
  setIsAddingComment: (v: boolean) => void;
}) {
  const readOnly = role !== 'carer';

  return (
    <div className="flex flex-col h-full" style={{ color: palette.text }}>
      {/* Detail header */}
      <div
        className="px-6 py-6 flex items-center border-b border-black/10"
        style={{ backgroundColor: palette.pageBg }}
      >
        <button
          onClick={() => setSelectedTask(null)}
          className="mr-6 text-2xl font-extrabold"
          aria-label="Back to tasks"
          title="Back"
        >
          {'<'}
        </button>
        <h2 className="text-3xl md:text-4xl font-extrabold">{task.label}</h2>
      </div>

      {/* Detail body */}
      <div className="p-6 flex flex-col gap-4 text-xl">
        <p>
          <span className="font-extrabold">Frequency:</span> {task.frequency}
        </p>
        <p>
          <span className="font-extrabold">Last Done:</span> {task.lastDone}
        </p>
        <p>
          <span className="font-extrabold">Scheduled Due:</span> {task.nextDue}
        </p>
        <p>
          <span className="font-extrabold">Status:</span>{' '}
          {(() => {
            const derived = derivedOccurrenceStatus(task);
            return (
              <span
                className={`px-3 py-1 rounded-full text-sm font-extrabold ${getStatusBadgeClasses(
                  derived
                )}`}
              >
                {derived}
              </span>
            );
          })()}
        </p>
        {/* Comments */}
        <div className="mt-2">
          <h3 className="font-extrabold text-2xl mb-2">Comments</h3>
          {task.comments?.length ? (
            <ul className="list-disc pl-6 space-y-1">
              {task.comments.map((c, idx) => (
                <li key={idx}>{c}</li>
              ))}
            </ul>
          ) : (
            <p className="italic">No comments yet.</p>
          )}
        </div>

        {/* Files */}
        <div className="mt-2">
          <h3 className="font-extrabold text-2xl mb-2">Available Files</h3>
          {task.files?.length ? (
            <ul className="list-disc pl-6 space-y-1">
              {task.files.map((f, idx) => (
                <li key={idx}>{f}</li>
              ))}
            </ul>
          ) : (
            <p className="italic">No files uploaded yet.</p>
          )}
        </div>

        {/* Add comment (carer only) */}
        {!readOnly && isAddingComment && (
          <div className="mt-3 p-4 border rounded bg-white">
            <textarea
              className="w-full border rounded p-3 text-lg"
              placeholder="Write your comment..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
            />
            <div className="flex justify-end gap-3 mt-3">
              <button
                className="px-4 py-2 border rounded bg-gray-200"
                onClick={() => {
                  setIsAddingComment(false);
                  setNewComment('');
                }}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 border rounded text-white"
                style={{ backgroundColor: palette.header }}
                onClick={() => {
                  if (newComment.trim()) addComment(task.id, newComment.trim());
                }}
              >
                Save
              </button>
            </div>
          </div>
        )}

        {/* Footer actions */}
        <div className="flex gap-4 py-10 mt-auto flex-wrap">
          {role === 'carer' && (
            <>
              <button
                className="px-5 py-2 border rounded bg-white"
                onClick={() => {
                  setTasks((prev) =>
                    prev.map((t) =>
                      t.id === task.id ? { ...t, status: 'Completed' } : t
                    )
                  );
                }}
              >
                Mark as done
              </button>
              <button
                className="px-5 py-2 border rounded bg-white"
                onClick={() => setIsAddingComment(true)}
              >
                Add comment
              </button>
              <label className="px-5 py-2 border rounded bg-white cursor-pointer">
                Upload File
                <input
                  type="file"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files?.length)
                      addFile(task.id, e.target.files[0].name);
                  }}
                />
              </label>
            </>
          )}

          {role === 'management' && (
            <button
              className="px-5 py-2 border rounded bg-white"
              onClick={() => {
                const currStatus = (task.status || '').toLowerCase();

                if (currStatus !== 'waiting verification') {
                  alert(
                    'This task cannot be marked as completed yet. The carer must first mark the task as done.'
                  );
                  return;
                }

                setTasks((prev) =>
                  prev.map((t) =>
                    t.id === task.id ? { ...t, status: 'Completed' } : t
                  )
                );
              }}
            >
              Mark as completed
            </button>
          )}

          {/* Carer only: quick link to transaction history */}
          {role === 'carer' && (
            <p className="mt-4 text-base">
              Need to add a receipt/view a receipt?{' '}
              <a
                href="/calendar_dashboard/transaction_history"
                className="underline"
              >
                Go to transactions
              </a>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
