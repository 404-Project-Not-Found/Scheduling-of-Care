'use client';

import { Suspense, useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import CalendarPanel from '@/components/dashboard/CalendarPanel';
import TasksPanel from '@/components/tasks/TasksPanel';
import dynamic from 'next/dynamic';
import { Task } from './types';

// Dynamically import the MenuDrawer to avoid SSR issues for this page component
const MenuDrawer = dynamic(
  () => import('@/app/menu/page').then((m) => m.MenuDrawer),
  { ssr: false }
);

// ---- Demo client ids used by the family list hardcode ----
const FULL_DASH_ID = 'hardcoded-full-1'; // Mary Hong
const PARTIAL_DASH_ID = 'hardcoded-partial-1'; // John Smith

// Fallback map in case currentClientName wasn't set for some reason
const NAME_BY_ID: Record<string, string> = {
  [FULL_DASH_ID]: 'Mary Hong',
  [PARTIAL_DASH_ID]: 'John Smith',
};

// Utility: read/write "viewer role" (carer | family | management)
type Role = 'carer' | 'family' | 'management';

function getInitialRole(searchParams: URLSearchParams): Role {
  const viewer = searchParams.get('viewer');
  if (viewer === 'family') return 'family';

  if (typeof window !== 'undefined') {
    const stored =
      (localStorage.getItem('activeRole') as Role | null) ?? undefined;
    if (stored === 'family' || stored === 'management' || stored === 'carer')
      return stored;
  }
  return 'carer';
}

// Page wrapper with Suspense
export default function DashboardPage() {
  return (
    <Suspense
      fallback={<div className="p-6 text-gray-500">Loading dashboard...</div>}
    >
      <DashboardContent />
    </Suspense>
  );
}

function DashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const addedFile = searchParams.get('addedFile');

  // Role (mock)
  const [role, setRole] = useState<Role>(() => getInitialRole(searchParams));

  const [open, setOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>('');

  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isAddingComment, setIsAddingComment] = useState(false);
  const [newComment, setNewComment] = useState('');

  // Who is the dashboard for?
  const [activeClientId, setActiveClientId] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState<string>('');

  // Persist role if viewer=family and mark lastDashboard=full for family back-routing
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const viewer = searchParams.get('viewer');
    if (viewer === 'family') {
      localStorage.setItem('activeRole', 'family');
      localStorage.setItem('viewer', 'family');
      localStorage.setItem('lastDashboard', 'full'); // important for "Back" on other pages
      setRole('family');
    } else {
      localStorage.setItem('activeRole', role);
    }
  }, [searchParams, role]);

  // Close drawer with Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    if (open) document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  // Resolve which client and display name we show (match partial logic)
  useEffect(() => {
    const cid =
      typeof window !== 'undefined'
        ? localStorage.getItem('activeClientId')
        : null;
    setActiveClientId(cid);

    // Priority:
    // 1) currentClientName (set by family list page before navigating)
    // 2) fallback by known demo id → name
    let name = '';
    try {
      name = localStorage.getItem('currentClientName') || '';
    } catch {}

    if (!name && cid) {
      name = NAME_BY_ID[cid] || '';
    }

    setDisplayName(name);
  }, []);

  // Load tasks from localStorage (or seed defaults)
  useEffect(() => {
    const stored = localStorage.getItem('tasks');
    if (stored) {
      try {
        setTasks(JSON.parse(stored));
        return;
      } catch {
        // fall through to defaults
      }
    }
    setTasks([
      {
        id: '1',
        title: 'Dental Appointment',
        frequency: 'Monthly',
        lastDone: '2025-09-15',
        nextDue: '2025-10-01',
        status: 'Pending',
        comments: [],
        files: [],
      },
      {
        id: '2',
        title: 'Replace Toothbrush Head',
        frequency: 'Every 3 months',
        lastDone: '2025-07-13',
        nextDue: '2025-10-13',
        status: 'Pending',
        comments: [],
        files: [],
      },
      {
        id: '3',
        title: 'Submit Report',
        frequency: 'Weekly',
        lastDone: '2025-09-18',
        nextDue: '2025-09-25',
        status: 'Due',
        comments: [],
        files: [],
      },
    ]);
  }, []);

  // Persist tasks on change
  useEffect(() => {
    if (tasks.length > 0) {
      try {
        localStorage.setItem('tasks', JSON.stringify(tasks));
      } catch {}
    }
  }, [tasks]);

  // Handle file injection via ?addedFile=...
  const hasAddedFile = useRef(false);
  useEffect(() => {
    if (addedFile && selectedTask && !hasAddedFile.current) {
      addFile(selectedTask.id, addedFile);
      hasAddedFile.current = true;
    }
  }, [addedFile, selectedTask]);

  // Filtered list by date
  const filteredTasks = selectedDate
    ? tasks.filter((t) => t.nextDue === selectedDate)
    : tasks;

  // Mutators
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

  const getStatusBadgeClasses = (status: string | undefined) => {
    switch (status?.toLowerCase()) {
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

  // Navigate to Edit Profile for THIS client (never to another dashboard)
  const goEditProfile = () => {
    // keep role so Edit Profile can route back correctly
    localStorage.setItem('activeRole', role);
    if (activeClientId) {
      router.push(
        `/client_profile?new=false&id=${activeClientId}&from=full_dashboard`
      );
    } else {
      router.push('/client_profile?new=true&from=full_dashboard');
    }
  };

  return (
    <div className="min-h-screen relative">
      {/* Help button with hover tooltip */}
      <div className="fixed bottom-8 right-8 z-50">
        <button
          className="w-10 h-10 rounded-full text-white font-bold text-lg relative peer"
          style={{ backgroundColor: '#ed5f4f' }}
          aria-label="Open dashboard help"
        >
          ?
        </button>

        <div className="absolute bottom-14 right-0 w-80 p-4 bg-white border border-gray-400 rounded shadow-lg text-black text-sm opacity-0 peer-hover:opacity-100 transition-opacity pointer-events-none">
          <h3 className="font-bold mb-2">Dashboard Help</h3>
          <ul className="list-disc list-inside space-y-1">
            <li>
              Click the <span className="font-bold">≡</span> button to open menu
              options.
            </li>
            <li>
              Calendar: click a highlighted blue date to view tasks due that
              day.
            </li>
            <li>The red highlighted day is today.</li>
            <li>
              Click a task to view details, add comments, upload files, or mark
              as done.
            </li>
            <li>
              Go to{' '}
              <span className="font-bold underline text-blue-600">
                transactions
              </span>{' '}
              to manage receipts.
            </li>
          </ul>
        </div>
      </div>

      <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-10 items-stretch px-20 mt-10">
        {/* LEFT: Calendar */}
        <section className="flex flex-col rounded-2xl overflow-hidden bg-[#F7ECD9] border border-black/10">
          <div className="bg-[#3d0000] text-white px-5 py-6 flex items-center justify-between">
            <div className="text-2xl font-semibold flex items-center gap-4">
              <button
                onClick={() => setOpen(true)}
                className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-white/15 cursor-pointer"
                aria-label="Open menu"
              >
                ≡
              </button>
              <span>Dashboard</span>
              <Image
                src="/dashboardLogo.png"
                alt="App Logo"
                width={96}
                height={96}
                className="object-contain"
              />
            </div>

            {/* Right: dynamic name + viewer badge + avatar → edit profile */}
            <div className="flex items-center gap-3">
              <span>{displayName || '—'}</span>

              {role === 'family' && (
                <span className="px-2 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
                  Family/POA view only
                </span>
              )}

              <div
                role="button"
                tabIndex={0}
                onClick={goEditProfile}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') goEditProfile();
                }}
                className="h-10 w-10 rounded-full bg-gray-300 border border-white flex items-center justify-center text-sm font-semibold text-gray-700 cursor-pointer hover:opacity-80"
                title="Edit profile"
                aria-label="Edit profile"
              >
                {(displayName && displayName[0]) || '•'}
              </div>
            </div>
          </div>

          <div className="p-5 flex-1 relative">
            <CalendarPanel
              tasks={tasks}
              onDateClick={(date: string) => setSelectedDate(date)}
            />
          </div>
        </section>

        {/* RIGHT: Task Panel (relative so the family back button can anchor bottom-right) */}
        <section className="relative flex flex-col rounded-2xl overflow-hidden bg-[#F7ECD9] border border-black/10">
          {!selectedTask ? (
            <>
              <div className="bg-[#3d0000] text-white px-5 py-6">
                <h2 className="text-2xl font-semibold">Tasks</h2>
              </div>
              <div className="p-5 flex-1">
                <TasksPanel
                  tasks={
                    selectedDate
                      ? tasks.filter((t) => t.nextDue === selectedDate)
                      : tasks
                  }
                  onTaskClick={(task: Task) => setSelectedTask(task)}
                />
              </div>
            </>
          ) : (
            <TaskDetail
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

          {/* ▼▼ Only for family: Back to client list (bottom-right of the Tasks panel) ▼▼ */}
          {role === 'family' && (
            <button
              onClick={() => router.push('/clients_list')}
              className="absolute bottom-4 right-4 px-4 py-2 rounded-lg bg-orange-400 text-black font-semibold shadow-md hover:bg-orange-500"
              aria-label="Back to Client List"
              title="Back to Client List"
            >
              Back to Client List
            </button>
          )}
        </section>
      </div>

      <MenuDrawer open={open} onClose={() => setOpen(false)} />
    </div>
  );
}

function TaskDetail({
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
  return (
    <div className="flex flex-col h-full">
      <div className="bg-[#3d0000] text-white px-5 py-4 flex items-center">
        <button
          onClick={() => setSelectedTask(null)}
          className="mr-4 text-xl font-bold"
          aria-label="Back to tasks"
        >
          ←
        </button>
        <h2 className="text-xl font-bold">{task.title}</h2>
      </div>

      <div className="p-5 text-black flex flex-col gap-3 flex-1">
        <p>
          <span className="font-bold">Frequency:</span> {task.frequency}
        </p>
        <p>
          <span className="font-bold">Last Done:</span> {task.lastDone}
        </p>
        <p>
          <span className="font-bold">Next Due:</span> {task.nextDue}
        </p>
        <p>
          <span className="font-bold">Status:</span>{' '}
          <span
            className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusBadgeClasses(task.status)}`}
          >
            {task.status}
          </span>
        </p>

        {/* Comments */}
        <div className="mt-4">
          <h3 className="font-bold text-lg mb-2">Comments:</h3>
          {task.comments && task.comments.length > 0 ? (
            <ul className="list-disc pl-5 space-y-1">
              {task.comments.map((c, idx) => (
                <li key={idx}>{c}</li>
              ))}
            </ul>
          ) : (
            <p className="italic">No comments yet.</p>
          )}
        </div>

        {/* Files */}
        <div className="mt-4">
          <h3 className="font-bold text-lg mb-2">Files:</h3>
          {task.files && task.files.length > 0 ? (
            <ul className="list-disc pl-5 space-y-1">
              {task.files.map((f, idx) => (
                <li key={idx}>{f}</li>
              ))}
            </ul>
          ) : (
            <p className="italic">No files uploaded yet.</p>
          )}
        </div>

        {/* Add Comment Box */}
        {isAddingComment && (
          <div className="mt-3 p-3 border rounded bg-white">
            <textarea
              className="w-full border rounded p-2 text-black"
              placeholder="Write your comment..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
            />
            <div className="flex justify-end gap-2 mt-2">
              <button
                className="px-3 py-1 border rounded bg-gray-200 text-black"
                onClick={() => {
                  setIsAddingComment(false);
                  setNewComment('');
                }}
              >
                Cancel
              </button>
              <button
                className="px-3 py-1 border rounded bg-[#3d0000] text-white"
                onClick={() => {
                  if (newComment.trim()) addComment(task.id, newComment.trim());
                }}
              >
                Save
              </button>
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex gap-3 mt-auto flex-wrap">
          <button
            className="px-4 py-2 border rounded bg-white text-black"
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
            className="px-4 py-2 border rounded bg-white text-black"
            onClick={() => setIsAddingComment(true)}
          >
            Add comment
          </button>

          <label className="px-4 py-2 border rounded bg-white text-black cursor-pointer">
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

          <div className="mt-2 text-black text-sm">
            Need to add a receipt/view receipts? Go to{' '}
            <span
              className="underline cursor-pointer text-blue-600 hover:text-blue-800"
              onClick={() => (window.location.href = '/transaction_history')}
            >
              transactions
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
