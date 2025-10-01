/**
 * Frontend:
 *   - Authors: Vanessa Teo & Qingyue Zhao
 *   - Role-aware view: carers / family / management enter through different entry points.
 *
 * Notes in this revision:
 *   1) side menu change to top menu
 *   2) Title reflects selected client: "<Name>’s Schedule".
 */

/**
 * Dashboard (Client Schedule) — Top menu mapped from former side menu
 *
 * - Top menu items (paths taken from previous side menu):
 *   1) /calender_dashboard/budget_report         -> "Budget Report" (all users)
 *   2) /calender_dashboard/transaction_history   -> "View Transactions" (all users)
 *   3）request log (management）
 *   4) Care Items (MANAGEMENT only dropdown):
 *        - /management_dashboard/manage_care_item/edit -> "Manage care item"
 *        - /management_dashboard/manage_care_item/add  -> "Add new care item"
 *   5) request of change from (family)
 *
 * - Left-top logo is larger and clickable; clicking goes "home" while preserving role.
 * - Default state (no client selected):
 *     dropdown = "- Select a client -"
 *     title = "Client Schedule"
 *     calendar highlights suppressed
 *     tasks empty
 */

'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';

import CalendarPanel from '@/components/dashboard/CalendarPanel';
import TasksPanel from '@/components/tasks/TasksPanel';
import { getTasksFE, saveTasksFE, type Task } from '@/lib/mockApi';

// ---------- Routes (edit to match your app if needed) ----------
const ROUTES = {
  homeByRole: '/empty_dashboard', // Preserve role via localStorage, then land here
  budgetReport: '/calender_dashboard/budget_report',
  transactions: '/calender_dashboard/transaction_history',
  carerManageAccount: '/calender_dashboard/update_details',
  mgmtCareEdit: '/management_dashboard/manage_care_item/edit',
  mgmtCareAdd: '/management_dashboard/manage_care_item/add',
  accountUpdate: '/management/profile', // Manager profile (avatar dropdown)
  signOut: '/api/auth/signout',
};

// ---------- Palette ----------
const palette = {
  header: '#3A0000', // brown top bar
  banner: '#F9C9B1', // pink toolbar
  text: '#2b2b2b',
  white: '#FFFFFF',
  pageBg: '#FAEBDC', // right column bg
};

function hexToRgba(hex: string, alpha = 1) {
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

type Role = 'carer' | 'family' | 'management';
type Client = { id: string; name: string };

function getInitialRole(): Role {
  if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_ENABLE_MOCK === '1') {
    const v = (sessionStorage.getItem('mockRole') || '').toLowerCase();
    if (v === 'carer' || v === 'family' || v === 'management') return v as Role;
  }
  return 'carer';
}

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

  // ---- Role & menus ----
  const [role] = useState<Role>(getInitialRole);
  const [careMenuOpen, setCareMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  // ---- Clients / tasks ----
  const [activeClientId, setActiveClientId] = useState<string | null>(null); // default: none selected
  const [displayName, setDisplayName] = useState('');
  const [clients, setClients] = useState<Client[]>([
    { id: 'c-1', name: 'Client A' },
    { id: 'c-2', name: 'Client B' },
  ]);

  const [selectedDate, setSelectedDate] = useState('');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isAddingComment, setIsAddingComment] = useState(false);
  const [newComment, setNewComment] = useState('');

  // ---- Load & persist tasks ----
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

  // ---- Optional: attach file via query (?addedFile=...) ----
  const hasAddedFile = useRef(false);
  useEffect(() => {
    if (role !== 'carer') return;
    if (addedFile && selectedTask && !hasAddedFile.current) {
      addFile(selectedTask.id, addedFile);
      hasAddedFile.current = true;
    }
  }, [addedFile, selectedTask, role]);

  // ---- Derived ----
  const noClientSelected = !activeClientId;
  const byClient = noClientSelected
    ? []
    : tasks.filter((t) => ((t as any).clientId ? (t as any).clientId === activeClientId : true));
  const filteredTasks = selectedDate ? byClient.filter((t) => t.nextDue === selectedDate) : byClient;

  // ---- Handlers ----
  const onClientChange = (id: string) => {
    if (!id) {
      setActiveClientId(null);
      setDisplayName('');
      return;
    }
    const c = clients.find((x) => x.id === id);
    setActiveClientId(id);
    setDisplayName(c?.name || '');
  };

  const goHome = () => {
    if (typeof window !== 'undefined') localStorage.setItem('activeRole', role);
    router.push(ROUTES.homeByRole);
  };
  const onPrint = () => typeof window !== 'undefined' && window.print();

  const addComment = (taskId: string, comment: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, comments: [...(t.comments || []), comment] } : t)),
    );
    setSelectedTask((prev) => (prev ? { ...prev, comments: [...(prev.comments || []), comment] } : prev));
    setNewComment('');
    setIsAddingComment(false);
  };
  const addFile = (taskId: string, fileName: string) => {
    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, files: [...(t.files || []), fileName] } : t)));
    setSelectedTask((prev) => (prev ? { ...prev, files: [...(prev.files || []), fileName] } : prev));
  };
  const getStatusBadgeClasses = (status?: string) => {
    switch ((status || '').toLowerCase()) {
      case 'due': return 'bg-red-500 text-white';
      case 'pending': return 'bg-orange-400 text-white';
      case 'completed': return 'bg-green-500 text-white';
      default: return 'bg-gray-300 text-black';
    }
  };

  const isCarer = role === 'carer';
  const isManagement = role === 'management';

  // ---- Layout ----
  return (
    <div className="h-screen flex flex-col" style={{ color: palette.text }}>
      {/* ========= TOP HEADER (brown) with bigger logo + large white bold nav ========= */}
      <header
        className="px-4 md:px-8 py-2 flex items-center justify-between"
        style={{ backgroundColor: palette.header, color: 'white' }}
      >
        {/* Left: BIG clickable logo -> home (increase width/height to make it even bigger) */}
        <button onClick={goHome} className="flex items-center gap-4 hover:opacity-90" title="Go to dashboard">
          <Image
            src="/dashboardLogo.png"
            alt="Logo"
            width={112}  /* ⬅️ logo enlarged */
            height={112}
            className="object-contain"
            priority
          />
          {/* Brand title (bigger & bold) */}
          <span className="font-extrabold leading-none text-2xl md:text-3xl">
            Client Schedule
          </span>
        </button>

        {/* Center: TOP MENU mapped from your side menu (2x font, white, bold) */}
        <nav className="hidden lg:flex items-center gap-10 font-extrabold text-white text-2xl">
          <button onClick={() => router.push(ROUTES.budgetReport)} className="hover:underline">
            Budget Report
          </button>
          <button onClick={() => router.push(ROUTES.transactions)} className="hover:underline">
            View Transactions
          </button>

          {/* Carer-only item */}
          {isCarer && (
            <button onClick={() => router.push(ROUTES.carerManageAccount)} className="hover:underline">
              Manage your account
            </button>
          )}

          {/* Management-only dropdown: Care Items */}
          {isManagement && (
            <div className="relative">
              <button
                onClick={() => setCareMenuOpen((v) => !v)}
                className="hover:underline inline-flex items-center gap-2"
                aria-haspopup="menu"
                aria-expanded={careMenuOpen}
              >
                Care Items <span className="text-white/90">{careMenuOpen ? '▲' : '▼'}</span>
              </button>
              {careMenuOpen && (
                <div
                  className="absolute left-1/2 -translate-x-1/2 mt-3 w-80 rounded-md border border-white/30 bg-white text-black shadow-2xl z-50"
                  role="menu"
                >
                  <button
                    className="w-full text-left px-5 py-4 text-xl font-semibold hover:bg-black/5"
                    onClick={() => { setCareMenuOpen(false); router.push(ROUTES.mgmtCareEdit); }}
                  >
                    Manage care item
                  </button>
                  <button
                    className="w-full text-left px-5 py-4 text-xl font-semibold hover:bg黑/5 hover:bg-black/5"
                    onClick={() => { setCareMenuOpen(false); router.push(ROUTES.mgmtCareAdd); }}
                  >
                    Add new care item
                  </button>
                </div>
              )}
            </div>
          )}
        </nav>

        {/* Right: Manager avatar (default_profile.png) with dropdown */}
        <div className="relative">
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
                onClick={() => { setUserMenuOpen(false); router.push(ROUTES.accountUpdate); }}
              >
                Update your details
              </button>
              <button
                className="w-full text-left px-5 py-4 text-xl font-semibold hover:bg-black/5"
                onClick={() => { setUserMenuOpen(false); router.push(ROUTES.signOut); }}
              >
                Sign out
              </button>
            </div>
          )}
        </div>
      </header>

      {/* ========= PINK BANNER (taller) : select client | centered title | print ========= */}
      <div
        className="px-4 md:px-8 py-2 md:py-3 grid grid-cols-[auto_1fr_auto] items-center gap-6"
        style={{ backgroundColor: hexToRgba(palette.banner, 0.7) }}
      >
        {/* Left: Client select (default "- Select a client -") */}
        <div className="relative inline-block">
          <label className="sr-only">Select Client</label>
          <select
            className="appearance-none h-12 w-56 md:w-64 pl-8 pr-12 rounded-2xl border border-black/30 bg-white font-extrabold text-xl shadow-sm focus:outline-none"
            value={activeClientId || ''}
            onChange={(e) => onClientChange(e.target.value)}
            aria-label="Select client"
          >
            <option value="">{'- Select a client -'}</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-black/60 text-xl">▾</span>
        </div>

        {/* Center: plain title (bigger; slight negative margin to look optically centered) */}
        <div className="justify-self-center -ml-8 md:-ml-8">
          <h1 className="font-extrabold leading-none text-2xl md:text-3xl select-none">
            {displayName ? `${displayName}’s Schedule` : 'Client Schedule'}
          </h1>
        </div>

        {/* Right: Print */}
        <div className="justify-self-end">
          <button
            onClick={onPrint}
            className="inline-flex items-center px-6 py-3 rounded-2xl border border-black/30 bg-white font-extrabold text-xl hover:bg-black/5"
            title="Print"
          >
            Print
          </button>
        </div>
      </div>

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
                <h2 className="text-3xl md:text-4xl font-extrabold">Tasks</h2>
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

      {/* ========= Calendar square + compact overrides ========= */}
      <style jsx global>{`
        /* Make calendar container exactly square */
        .calendar-square { position: relative; width: 100%; }
        .calendar-square::before { content: ''; display: block; padding-top: 100%; } /* 1:1 */
        .calendar-square > .calendar-compact { position: absolute; inset: 0; }

        /* Compact grid so full month fits in the square (tune if needed) */
        .calendar-compact .grid.grid-cols-7 {
          row-gap: 0.15rem !important;
          column-gap: 0.25rem !important;
        }
        .calendar-compact [role="gridcell"],
        .calendar-compact .day-cell,
        .calendar-compact .date-cell,
        .calendar-compact .cal-cell {
          height: 30px !important;
          min-height: 30px !important;
          padding: 0 !important;
          line-height: 1.05 !important;
        }
        .calendar-compact [role="gridcell"] > button,
        .calendar-compact .day-cell > button,
        .calendar-compact .date-cell > button {
          height: 100% !important;
          width: 100% !important;
          padding: 0 !important;
        }
        .calendar-compact [data-cal-header],
        .calendar-compact .weekday,
        .calendar-compact .dow {
          padding: 2px 0 !important;
          line-height: 1.1 !important;
          font-size: 1rem !important;
        }

        /* Suppress highlights when no client is selected */
        .no-highlight .today,
        .no-highlight .is-today,
        .no-highlight [data-today="true"],
        .no-highlight .selected,
        .no-highlight [aria-selected="true"] {
          background: transparent !important;
          color: inherit !important;
          box-shadow: none !important;
          border-color: transparent !important;
        }
        .no-highlight .today *, .no-highlight .selected * {
          background: transparent !important;
          color: inherit !important;
          box-shadow: none !important;
        }
      `}</style>
      
    </div>
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
                className="px-5 py-2 border rounded bg白 bg-white"
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
