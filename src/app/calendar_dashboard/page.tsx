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
 * Last Updated by Denise Alexander - 7/10/2025: back-end integrated for
 * fetching user role and clients.
 */

'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

import DashboardChrome from '@/components/top_menu/client_schedule';
import CalendarPanel from '@/components/dashboard/CalendarPanel';
import TasksPanel from '@/components/tasks/TasksPanel';

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

/* ------------------------------ Routes ------------------------------ */
const ROUTES = {
  requestForm: '/family_dashboard/request_of_change_form',
  requestLog: '/management_dashboard/requests',
  homeByRole: '/empty_dashboard',
  budgetReport: '/calendar_dashboard/budget_report',
  transactions: '/calendar_dashboard/add_tran',
  mgmtCareEdit: '/management_dashboard/manage_care_item/edit',
  mgmtCareAdd: '/management_dashboard/manage_care_item/add',
  myPWSN: 'family_dashboard/people_list',
  accountUpdate: '/client_profile',
  signOut: '/calendar_dashboard/update_details',
  transaction: '/calendar_dashboard/transaction_history',
};

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
  const [role, setRole] = useState<Role>('carer'); //default

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

  // Loads clients and active client on component mount
  useEffect(() => {
    (async () => {
      try {
        // Fetches all clients
        const list: ApiClient[] = await getClients(); // ApiClient[]
        // Maps API response to simpler ClientLite objects with orgAccess
        const mapped: ClientLite[] = (list as ApiClientWithAccess[]).map(
          (c) => ({
            id: c._id,
            name: c.name,
            orgAccess: c.orgAccess,
          })
        );
        setClients(mapped);

        // Fetches the currently active client from context
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

  // Handler for changing active client
  const onClientChange = async (id: string) => {
    if (!id) {
      setActiveClientId(null);
      setDisplayName('');
      await setActiveClient(null);
      return;
    }

    // Find selected client in current list
    const c = clients.find((x) => x.id === id);
    const name = c?.name || '';
    setActiveClientId(id);
    setDisplayName(name);
    await setActiveClient(id, name);
  };

  /* ------------------------------ Tasks ----------------------------- */
  const [selectedDate, setSelectedDate] = useState('');
  const [visibleMonth, setVisibleMonth] = useState<string>(new Date().toISOString().slice(0, 7));

  const [tasks, setTasks] = useState<ClientTask[]>([]);
  const [selectedTask, setSelectedTask] = useState<ClientTask | null>(null);

  const [isAddingComment, setIsAddingComment] = useState(false);
  const [newComment, setNewComment] = useState('');

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
  const noClientSelected = !activeClientId;

  const tasksByClient: ClientTask[] = activeClientId
    ? tasks.filter((t): t is ClientTask => (t.clientId ?? '') === activeClientId)
    : [];

  function getDueISO(t: ClientTask): string {
    return (t.nextDue ?? '').slice(0, 10);
  }

  const tasksForCalendar: ClientTask[] = tasksByClient.filter((t) => {
    const due = getDueISO(t);
    if (!due) return false;
    
    if (selectedDate) return due === selectedDate;
    
    const month = due.slice(0, 7); 
    return month === visibleMonth;
  });

  const filteredTasks = selectedDate
    ? tasksByClient.filter((t) => t.nextDue === selectedDate)
    : tasksByClient;

  /* -------------------- RIGHT PANE: title search -------------------- */
  const [searchTerm, setSearchTerm] = useState('');
  const tasksForRightPane = tasksForCalendar.filter((t) => {
    const title = (t?.title ?? '').toLowerCase();
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
      case 'due':
        return 'bg-red-500 text-white';
      case 'pending':
        return 'bg-orange-400 text-white';
      case 'completed':
        return 'bg-green-500 text-white';
      default:
        return 'bg-gray-300 text-black';
    }
  };

  // Logo → home
  const onLogoClick = () => {
    router.push('/schedule_dashboard');
  };

  /* ------------------------------ Render ---------------------------- */
  return (
    <DashboardChrome
      page="schedule"
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
            onMonthChange={(yyyyMm) => { 
              setVisibleMonth(yyyyMm); 
              setSelectedDate(''); 
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
                  <h2 className="text-3xl md:text-4xl font-extrabold">
                    Care Items
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
                  <p className="text-lg opacity-80">
                    Select a client to view tasks.
                  </p>
                )}
              </div>

              {/* Task list */}
              <div className="px-6 pb-8">
                <TasksPanel
                  tasks={tasksForRightPane}
                  onTaskClick={(task) => setSelectedTask(task)}
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
        <h2 className="text-3xl md:text-4xl font-extrabold">{task.title}</h2>
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
          <span className="font-extrabold">Next Due:</span> {task.nextDue}
        </p>
        <p>
          <span className="font-extrabold">Status:</span>{' '}
          <span
            className={`px-3 py-1 rounded-full text-sm font-extrabold ${getStatusBadgeClasses(
              task.status
            )}`}
          >
            {task.status}
          </span>
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
          <h3 className="font-extrabold text-2xl mb-2">Files</h3>
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
              <a href={ROUTES.transaction} className="underline">
                Go to transactions
              </a>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
