'use client';

/**
 * Calendar Dashboard (Schedule)
 * - Uses the shared DashboardChrome for consistent header/banner/top-menu.
 * - Role-aware actions in the task detail follow your original logic.
 * - Client selection is preserved in storage across pages.
 */

import { Suspense, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';

import DashboardChrome from '@/components/top_menu/client_schedule';
import CalendarPanel from '@/components/dashboard/CalendarPanel';
import TasksPanel from '@/components/tasks/TasksPanel';

import {
  getViewerRoleFE,
  getTasksFE,
  saveTasksFE,
  type Task,
  getClientsFE,
  readActiveClientFromStorage,
  writeActiveClientToStorage,
  type Client as ApiClient,
} from '@/lib/mockApi';

// Routes (kept identical)
const ROUTES = {
  requestForm: '/family_dashboard/request_of_change_form',
  requestLog: '/management_dashboard/requests',
  homeByRole: '/empty_dashboard',
  budgetReport: '/calender_dashboard/budget_report',
  transactions: '/calender_dashboard/transaction_history',
  mgmtCareEdit: '/management_dashboard/manage_care_item/edit',
  mgmtCareAdd: '/management_dashboard/manage_care_item/add',
  accountUpdate: '/management/profile',
  signOut: '/api/auth/signout',
};

// Palette (matches the calendar look)
const palette = {
  header: '#3A0000',
  banner: 'rgba(249, 201, 177, 0.7)',
  text: '#2b2b2b',
  pageBg: '#FAEBDC',
};

type Role = 'carer' | 'family' | 'management';
type Client = { id: string; name: string };

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

  // Role (read once; chrome may also use role for menu visibility if needed)
  const role: Role = getViewerRoleFE();

  // Clients
  const [clients, setClients] = useState<Client[]>([]);
  const [activeClientId, setActiveClientId] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState<string>('');

  useEffect(() => {
    (async () => {
      try {
        const list = await getClientsFE(); // ApiClient[]
        const mapped: Client[] = list.map((c: ApiClient) => ({ id: c._id, name: c.name }));
        setClients(mapped);

        const { id, name } = readActiveClientFromStorage();
        if (id) {
          setActiveClientId(id);
          setDisplayName(name || mapped.find(m => m.id === id)?.name || '');
        }
      } catch {
        setClients([]);
      }
    })();
  }, []);

  const onClientChange = (id: string) => {
    if (!id) {
      setActiveClientId(null);
      setDisplayName('');
      writeActiveClientToStorage('', '');
      return;
    }
    const c = clients.find((x) => x.id === id);
    const name = c?.name || '';
    setActiveClientId(id);
    setDisplayName(name);
    writeActiveClientToStorage(id, name);
  };

  // Tasks
  const [selectedDate, setSelectedDate] = useState('');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isAddingComment, setIsAddingComment] = useState(false);
  const [newComment, setNewComment] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const list = await getTasksFE();
        setTasks(Array.isArray(list) ? list : []);
      } catch {
        setTasks([]);
      }
    })();
  }, []);

  useEffect(() => {
    if (!tasks) return;
    (async () => {
      try {
        await saveTasksFE(tasks);
      } catch {}
    })();
  }, [tasks]);

  // Optional: attach file via query (?addedFile=...)
  const hasAddedFile = useRef(false);
  useEffect(() => {
    if (role !== 'carer') return;
    if (addedFile && selectedTask && !hasAddedFile.current) {
      addFile(selectedTask.id, addedFile);
      hasAddedFile.current = true;
    }
  }, [addedFile, selectedTask, role]);

  // Derived
  const noClientSelected = !activeClientId;
  const tasksByClient = noClientSelected
    ? []
    : tasks.filter((t) => ((t as any).clientId ? (t as any).clientId === activeClientId : true));
  const filteredTasks = selectedDate ? tasksByClient.filter((t) => t.nextDue === selectedDate) : tasksByClient;

  // Actions
  const addComment = (taskId: string, comment: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, comments: [...(t.comments || []), comment] } : t)),
    );
    setSelectedTask((prev) => (prev ? { ...prev, comments: [...(prev.comments || []), comment] } : prev));
    setNewComment('');
    setIsAddingComment(false);
  };

  const addFile = (taskId: string, fileName: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, files: [...(t.files || []), fileName] } : t)),
    );
    setSelectedTask((prev) => (prev ? { ...prev, files: [...(prev.files || []), fileName] } : prev));
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

  // Avatar dropdown passed into chrome
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const topRight = (
    <>
      <button
        onClick={() => setUserMenuOpen((v) => !v)}
        className="h-16 w-16 rounded-full overflow-hidden border-2 border-white/80 hover:border-white"
        aria-haspopup="menu"
        aria-expanded={userMenuOpen}
        title="Account"
      >
        <Image
          src="/default_profile.png"
          alt="Profile"
          width={64}
          height={64}
          className="h-full w-full object-cover"
        />
      </button>
      {userMenuOpen && (
        <div
          className="absolute right-0 mt-3 w-80 rounded-md border border-white/30 bg-white text-black shadow-2xl z-50"
          role="menu"
        >
          <button
            className="w-full text-left px-5 py-4 text-xl font-semibold hover:bg-black/5"
            onClick={() => {
              setUserMenuOpen(false);
              router.push(ROUTES.accountUpdate);
            }}
          >
            Update your details
          </button>
          <button
            className="w-full text-left px-5 py-4 text-xl font-semibold hover:bg-black/5"
            onClick={() => {
              setUserMenuOpen(false);
              router.push(ROUTES.signOut);
            }}
          >
            Sign out
          </button>
        </div>
      )}
    </>
  );

  // Logo → home (same as before)
  const onLogoClick = () => {
    if (typeof window !== 'undefined') localStorage.setItem('activeRole', role);
    router.push(ROUTES.homeByRole);
  };

  // Render with shared chrome
  return (
    <DashboardChrome
      page="schedule"
      clients={clients}
      activeClientId={activeClientId}
      activeClientName={displayName}
      onClientChange={onClientChange}
      colors={{ header: palette.header, banner: palette.banner, text: palette.text }}
      topRight={topRight}
      onLogoClick={onLogoClick}
    >
      {/* ========= Content: 2 columns (keep area sizes), calendar vertically centered ========= */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-0 min-h-0">
        {/* LEFT: Square calendar, vertically & horizontally centered in its area */}
        <section className="bg-white h-full overflow-auto p-0 flex items-center justify-center">
          <div className="calendar-square w-full max-w-full">
            <div className={`calendar-compact ${noClientSelected ? 'no-highlight' : ''} absolute inset-0 p-4 md:p-6`}>
              <CalendarPanel
                tasks={filteredTasks /* empty when no client */}
                onDateClick={(date: string) => setSelectedDate(date)}
              />
            </div>
          </div>
        </section>

        {/* RIGHT: Tasks (unchanged area size) */}
        <section className="h-full overflow-auto" style={{ backgroundColor: palette.pageBg }}>
          {!selectedTask ? (
            <>
              <div className="px-6 py-6">
                <h2 className="text-3xl md:text-4xl font-extrabold">Care Items</h2>
                {noClientSelected && (
                  <p className="text-lg mt-3 opacity-80">Select a client to view tasks.</p>
                )}
              </div>
              <div className="px-6 pb-8">
                <TasksPanel
                  tasks={filteredTasks}
                  onTaskClick={(task: Task) => setSelectedTask(task)}
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

/* ---------------- Right column: Task details ---------------- */
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
      <div className="px-6 py-6 flex items-center border-b border-black/10" style={{ backgroundColor: palette.pageBg }}>
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

      <div className="p-6 flex flex-col gap-4 flex-1 text-xl">
        <p><span className="font-extrabold">Frequency:</span> {task.frequency}</p>
        <p><span className="font-extrabold">Last Done:</span> {task.lastDone}</p>
        <p><span className="font-extrabold">Next Due:</span> {task.nextDue}</p>
        <p>
          <span className="font-extrabold">Status:</span>{' '}
          <span className={`px-3 py-1 rounded-full text-sm font-extrabold ${getStatusBadgeClasses(task.status)}`}>
            {task.status}
          </span>
        </p>

        <div className="mt-2">
          <h3 className="font-extrabold text-2xl mb-2">Comments</h3>
          {task.comments?.length ? (
            <ul className="list-disc pl-6 space-y-1">
              {task.comments.map((c, idx) => <li key={idx}>{c}</li>)}
            </ul>
          ) : <p className="italic">No comments yet.</p>}
        </div>

        <div className="mt-2">
          <h3 className="font-extrabold text-2xl mb-2">Files</h3>
          {task.files?.length ? (
            <ul className="list-disc pl-6 space-y-1">
              {task.files.map((f, idx) => <li key={idx}>{f}</li>)}
            </ul>
          ) : <p className="italic">No files uploaded yet.</p>}
        </div>

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
                onClick={() => { setIsAddingComment(false); setNewComment(''); }}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 border rounded text-white"
                style={{ backgroundColor: palette.header }}
                onClick={() => { if (newComment.trim()) addComment(task.id, newComment.trim()); }}
              >
                Save
              </button>
            </div>
          </div>
        )}

        <div className="flex gap-4 mt-auto flex-wrap">
          {role === 'carer' && (
            <>
              <button
                className="px-5 py-2 border rounded bg-white"
                onClick={() => {
                  setTasks((prev) =>
                    prev.map((t) => (t.id === task.id ? { ...t, status: 'Completed' } : t)),
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
                    if (e.target.files?.length) addFile(task.id, e.target.files[0].name);
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
                  prev.map((t) => (t.id === task.id ? { ...t, status: 'Completed' } : t)),
                );
              }}
            >
              Mark as completed
            </button>
          )}
        </div>
      </div>
    </div>
  );
}