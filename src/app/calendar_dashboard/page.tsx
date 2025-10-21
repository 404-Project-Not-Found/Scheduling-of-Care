/**
 * Calendar Dashboard (Schedule)
 * Front-end Authors: Vanessa Teo & Devni Wijesinghe & Qingyue Zhao
 * ------------------------------------------------------------
 * - Uses the shared <DashboardChrome /> for the top chrome.
 * - Client selection persists via localStorage helpers.
 * - Right column now has a name filter placed on the same row
 *   as the "Care Items" title, aligned to the RIGHT.
 * - The search filters tasks by title only (case-insensitive).
 *
 * Updated by Denise Alexander (7/10/2025): back-end integrated for
 * fetching user role and clients.
 *
 * Updated by Qingyue Zhao (8/10/2025):
 * - The calendar title (month/year) drives the right-pane title:
 *   * When a day is selected -> "Care items on YYYY-MM-DD"
 *   * Otherwise -> "All care items in <Month Year>"
 * - TasksPanel receives either `selectedDate` or `year`+`month` to filter items,
 *  add a dropdown of list of users with access to the selected client
 *
 * Last Updated by Zahra Rizqita - 17/10/2025
 * - Checking when task is marked as done by carer and when management mark task as completed
 * - Implement status change when this happens
 * - Real time update for task implementation
 * - Real time update for task verification
 * 
 * Last Updated by Denise Alexander (20/10/2025): UI design and layout changes for readability,
 * consistency and better navigation.
 */

'use client';

import { ArrowLeft, Search } from 'lucide-react';

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
import { Key } from 'lucide-react';

/* ------------------------------ Occurence helper ----------------------------- */
type WithOptionalSlug = { id: string; slug?: string };
const getSlug = (t: WithOptionalSlug) => t.slug ?? t.id;
const occKey = (slug: string, date: string) =>
  `${slug}__${(date || '').slice(0, 10)}`;

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
export type ClientTask = Task & {
  slug: string;
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
  type MaybeSlugTask = Task & { slug?: string };

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
  const [occurStatus, setOccurStatus] = useState<Record<string, StatusUI>>({});

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
        const list = await getTasks(activeClientId);
        setTasks(
          (Array.isArray(list) ? list : []).map((t: MaybeSlugTask) => ({
            ...t,
            slug: (t.slug ?? t.id).toLowerCase(),
          })) as ClientTask[]
        );
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
      addFile(selectedTask.slug, addedFile);
      hasAddedFile.current = true;
    }
  }, [addedFile, selectedTask, role]);

  useEffect(() => {
    (async () => {
      if (!selectedTask || !activeClientId || !selectedTask.nextDue) return;
      const url = `/api/v1/clients/${activeClientId}/care_item/${encodeURIComponent(selectedTask.slug)}/occurrence?date=${selectedTask.nextDue.slice(0, 10)}&include=files,comments`;
      const res = await fetch(url, { cache: 'no-store' });
      if (!res.ok) return;

      const data: { files?: string[]; comments?: string[] } = await res.json();

      setSelectedTask((prev) =>
        prev && prev.slug === selectedTask.slug
          ? { ...prev, files: data.files ?? [], comments: data.comments ?? [] }
          : prev
      );

      setTasks((prev) =>
        prev.map((t) =>
          t.slug === selectedTask.slug
            ? { ...t, files: data.files ?? [], comments: data.comments ?? [] }
            : t
        )
      );
    })();
  }, [selectedTask?.slug, selectedTask?.nextDue, activeClientId]);

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

  useEffect(() => {
    const slugs = tasksByClient.map(getSlug);
    const lcSlugs = slugs.map((s) => s.toLowerCase());
    if (!slugs.length) return;

    fetchOccurencesForWindow(windowStart, windowEnd, lcSlugs);
  }, [activeClientId, windowStart, windowEnd, tasksByClient.length]);

  function deriveStatusFromDate(due?: string): StatusUI {
    const date = (due || '').slice(0, 10);
    if (!date) return 'Due';
    const today = isoToday();
    if (date < today) return 'Overdue';
    if (date === today) return 'Due';
    return 'Due';
  }

  async function fetchOccurencesForWindow(
    startISO: string,
    endISO: string,
    slugs: string[]
  ) {
    if (!slugs.length) return;

    const params = new URLSearchParams({
      start: startISO.slice(0, 10),
      end: endISO.slice(0, 10),
      slugs: slugs.join(','),
    });

    const res = await fetch(
      `/api/v1/clients/${activeClientId}/occurence?${params.toString()}`
    );
    if (!res.ok) return;

    const rows: Array<{
      careItemSlug: string;
      date: string;
      status: StatusUI;
    }> = await res.json();
    setOccurStatus((prev) => {
      const next = { ...prev };
      for (const r of rows) {
        next[occKey(r.careItemSlug, r.date)] = r.status;
      }
      return next;
    });
  }

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

    const dbOccs = Object.entries(occurStatus)
      .filter(([key]) => key.startsWith(`${t.slug}__`))
      .map(([key, status]) => key.split('__')[1]);

    const allOccDates = Array.from(new Set([...occs, ...dbOccs]));

    return allOccDates.map((d) => {
      const key = occKey(t.slug, d);
      const uiStatus = occurStatus[key] ?? deriveStatusFromDate(d);
      return { ...t, nextDue: d, status: uiStatus } as ClientTask;
    });
  });

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
  const addComment = (slug: string, comment: string) => {
    setTasks((prev) =>
      prev.map((t) =>
        t.slug === slug
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

  const addFile = (slug: string, fileName: string) => {
    setTasks((prev) =>
      prev.map((t) =>
        t.slug === slug ? { ...t, files: [...(t.files || []), fileName] } : t
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
    const slug = task.slug;
    const doneAt = task.nextDue;

    if (!slug) {
      alert('This care item has no slug, cannot be marked as done');
      return;
    }
    if (!doneAt) {
      alert('No occurrence date found for this task.');
      return;
    }
    if (!fileName) {
      alert('Upload a file before marking as done.');
      return;
    }
    if (!activeClientId) {
      alert('Select a client first,');
      return;
    }
    try {
      const res = await fetch(
        `/api/v1/clients/${activeClientId}/care_item/${encodeURIComponent(slug)}/done`,
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
      setOccurStatus((prev) => ({
        ...prev,
        [occKey(slug, doneAt)]: 'Waiting Verification',
      }));
    } catch (err) {
      alert('Failed to mark as done: network server error.');
    }
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
                  {/* Input with search icon */}
                  <div className="relative mt-2 w-full max-w-[320px]">
                    <Search
                      size={20}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-black/60 pointer-events-none"
                    />
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Search care items"
                      className="h-11 w-full rounded-lg border pl-10 pr-4 text-black bg-white focus:outline-none focus:ring-2 focus:ring-[#F9C9B1]"
                    />
                  </div>
                </div>
                {noClientSelected && (
                  <p className="text-lg">Loading client&apos;s care items...</p>
                )}
              </div>

              {/* Task list */}
              <div className="px-6 pb-8">
                <TasksPanel
                  tasks={tasksForRightPane}
                  onTaskClick={(task) => setSelectedTask(task as ClientTask)}
                  selectedDate={selectedDate || undefined}
                  year={visibleYear ?? undefined}
                  month={visibleMonth ?? undefined}
                  clientLoaded={!noClientSelected}
                  onMarkDone={markTaskDone}
                  statusOverride={occurStatus}
                />
              </div>
            </>
          ) : (
            <TaskDetail
              role={role}
              task={selectedTask}
              clientId={activeClientId}
              setTasks={setTasks}
              setSelectedTask={setSelectedTask}
              addComment={addComment}
              addFile={addFile}
              getStatusBadgeClasses={getStatusBadgeClasses}
              newComment={newComment}
              setNewComment={setNewComment}
              isAddingComment={isAddingComment}
              setIsAddingComment={setIsAddingComment}
              onMarkDone={markTaskDone}
              occurStatus={occurStatus}
              setOccurStatus={setOccurStatus}
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
  clientId,
  setTasks,
  setSelectedTask,
  addComment,
  addFile,
  getStatusBadgeClasses,
  newComment,
  setNewComment,
  isAddingComment,
  setIsAddingComment,
  onMarkDone,
  occurStatus,
  setOccurStatus,
}: {
  role: 'carer' | 'family' | 'management';
  task: ClientTask;
  clientId: string | null;
  setTasks: React.Dispatch<React.SetStateAction<ClientTask[]>>;
  setSelectedTask: React.Dispatch<React.SetStateAction<ClientTask | null>>;
  addComment: (taskId: string, comment: string) => void;
  addFile: (taskId: string, fileName: string) => void;
  getStatusBadgeClasses: (status: string | undefined) => string;
  newComment: string;
  setNewComment: (v: string) => void;
  isAddingComment: boolean;
  setIsAddingComment: (v: boolean) => void;
  onMarkDone: (
    task: ClientTask,
    fileName: string,
    comment?: string
  ) => Promise<void>;
  occurStatus: Record<string, StatusUI>;
  setOccurStatus: React.Dispatch<
    React.SetStateAction<Record<string, StatusUI>>
  >;
}) {
  const readOnly = role !== 'carer';
  const lastUploadedFile =
    (Array.isArray(task.files) && task.files[task.files.length - 1]) || '';

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
          <ArrowLeft size={22} strokeWidth={2.5} />
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
            const key = occKey(task.slug, task.nextDue || '');
            const overridden = occurStatus[key];
            const display = overridden ?? derivedOccurrenceStatus(task);
            return (
              <span
                className={`px-3 py-1 rounded-full text-sm font-extrabold ${getStatusBadgeClasses(display)}`}
              >
                {display}
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
                  if (newComment.trim())
                    addComment(task.slug, newComment.trim());
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
                className={`px-5 py-2 border rounded bg-white ${!lastUploadedFile ? 'opacity-70' : ''}`}
                title={
                  !lastUploadedFile
                    ? 'Upload a file first'
                    : 'Mark this task as done'
                }
                onClick={async () => {
                  if (!lastUploadedFile) {
                    alert('Please upload a file before marking as done');
                    return;
                  }

                  await onMarkDone(
                    task,
                    lastUploadedFile,
                    newComment?.trim() || undefined
                  );
                  setNewComment('');
                  setIsAddingComment(false);
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
                      addFile(task.slug, e.target.files[0].name);
                  }}
                />
              </label>
            </>
          )}

          {role === 'management' && (
            <button
              className={`px-5 py-2 border rounded bg-white ${occurStatus[occKey(task.slug, task.nextDue) || ''] !== 'Waiting Verification' ? 'opacity-70' : ''}`}
              onClick={async () => {
                const due = task.nextDue;
                if (!due) return;

                const key = occKey(task.slug, due);
                const curr = occurStatus[key];

                if (curr !== 'Waiting Verification') {
                  alert(
                    'This task cannot be marked as completed yet. The carer must first mark the task as done.'
                  );
                  return;
                }
                try {
                  const res = await fetch(
                    `/api/v1/clients/${clientId}/care_item/${encodeURIComponent(task.slug)}/complete`,
                    {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ date: due }),
                    }
                  );
                  if (!res.ok) {
                    const msg = await res.json().catch(() => ({}));
                    alert(
                      `Failed to mark as completed: ${msg?.error ?? res.statusText}`
                    );
                    return;
                  }
                  setOccurStatus((prev) => ({ ...prev, [key]: 'Completed' }));
                } catch (e) {
                  alert('Network/Server error marking as completed');
                }
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
