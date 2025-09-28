'use client';

import { Suspense, useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import CalendarPanel from '@/components/dashboard/CalendarPanel';
import TasksPanel from '@/components/tasks/TasksPanel';
import dynamic from 'next/dynamic';
import { Task } from './types';

// Dynamically load MenuDrawer to avoid SSR issues
const MenuDrawer = dynamic(
  () => import('@/app/menu/page').then((m) => m.MenuDrawer),
  { ssr: false }
);

// Define allowed roles in the system
type Role = 'carer' | 'family' | 'management';

/**
 * Get initial role from query params or localStorage
 * - Checks "role" query parameter first
 * - Fallback: "viewer" query parameter
 * - Fallback: previously stored role in localStorage
 * - Default: "carer"
 */
function getInitialRole(searchParams: URLSearchParams): Role {
  const qpRole = searchParams.get('role');
  if (qpRole === 'family' || qpRole === 'management' || qpRole === 'carer') {
    if (typeof window !== 'undefined') {
      localStorage.setItem('activeRole', qpRole);
    }
    return qpRole as Role;
  }
  const viewer = searchParams.get('viewer');
  if (viewer === 'family') return 'family';
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('activeRole') as Role | null;
    if (stored === 'family' || stored === 'management' || stored === 'carer') {
      return stored;
    }
  }
  return 'carer';
}

// Main dashboard page with suspense wrapper
export default function DashboardPage() {
  return (
    <Suspense fallback={<div className="p-6 text-gray-500">Loading dashboard...</div>}>
      <DashboardContent />
    </Suspense>
  );
}

// Dashboard layout: Calendar (left) + Tasks (right)
function DashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const addedFile = searchParams.get('addedFile');

  // Current user role
  const [role, setRole] = useState<Role>(() => getInitialRole(searchParams));
  const [open, setOpen] = useState(false); // menu drawer state
  const [selectedDate, setSelectedDate] = useState<string>(''); // currently clicked calendar date
  const [tasks, setTasks] = useState<Task[]>([]); // all tasks
  const [selectedTask, setSelectedTask] = useState<Task | null>(null); // currently opened task detail
  const [isAddingComment, setIsAddingComment] = useState(false); // show/hide comment form
  const [newComment, setNewComment] = useState(''); // input text for new comment

  // Print action (only for carers/family)
  const handlePrint = () => window.print();

  // Initialize tasks: load from localStorage or fallback defaults
  useEffect(() => {
    const stored = localStorage.getItem('tasks');
    if (stored) {
      try {
        setTasks(JSON.parse(stored));
        return;
      } catch {}
    }
    // Demo tasks
    setTasks([
      { id: '1', title: 'Dental Appointment', frequency: 'Monthly', lastDone: '2025-09-15', nextDue: '2025-10-01', status: 'Pending', comments: [], files: [] },
      { id: '2', title: 'Replace Toothbrush Head', frequency: 'Every 3 months', lastDone: '2025-07-13', nextDue: '2025-10-13', status: 'Pending', comments: [], files: [] },
      { id: '3', title: 'Submit Report', frequency: 'Weekly', lastDone: '2025-09-18', nextDue: '2025-09-25', status: 'Due', comments: [], files: [] },
    ]);
  }, []);

  // Persist tasks to localStorage whenever they change
  useEffect(() => {
    if (tasks.length > 0) {
      localStorage.setItem('tasks', JSON.stringify(tasks));
    }
  }, [tasks]);

  // Add new comment to a task
  const addComment = (taskId: string, comment: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, comments: [...(t.comments || []), comment] } : t))
    );
    setSelectedTask((prev) => (prev ? { ...prev, comments: [...(prev.comments || []), comment] } : prev));
    setNewComment('');
    setIsAddingComment(false);
  };

  // Add new file to a task
  const addFile = (taskId: string, fileName: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, files: [...(t.files || []), fileName] } : t))
    );
    setSelectedTask((prev) => (prev ? { ...prev, files: [...(prev.files || []), fileName] } : prev));
  };

  // Badge style for task status
  const getStatusBadgeClasses = (status: string | undefined) => {
    switch (status?.toLowerCase()) {
      case 'due': return 'bg-red-500 text-white';
      case 'pending': return 'bg-orange-400 text-white';
      case 'completed': return 'bg-green-500 text-white';
      default: return 'bg-gray-300 text-black';
    }
  };

  return (
    <div className="min-h-screen relative">
      <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-10 items-stretch px-20 mt-10">
        {/* LEFT: Calendar section */}
        <section className="flex flex-col rounded-2xl overflow-hidden bg-[#F7ECD9] border border-black/10">
          <div className="bg-[#3d0000] text-white px-5 py-6 flex items-center justify-between">
            <div className="text-2xl font-semibold flex items-center gap-4">
              <button onClick={() => setOpen(true)} className="h-8 w-8 rounded-full bg-white/15">≡</button>
              <span>Dashboard</span>
              <Image src="/dashboardLogo.png" alt="App Logo" width={96} height={96} />
            </div>
          </div>
          <div className="p-5 flex-1 relative">
            <CalendarPanel tasks={tasks} onDateClick={(date: string) => setSelectedDate(date)} />
          </div>
        </section>

        {/* RIGHT: Tasks section */}
        <section className="relative flex flex-col rounded-2xl overflow-hidden bg-[#F7ECD9] border border-black/10">
          {!selectedTask ? (
            <>
              {/* Task list header */}
              <div className="bg-[#3d0000] text-white px-5 py-6">
                <h2 className="text-2xl font-semibold">Tasks</h2>
              </div>
              {/* Task list (filtered by selectedDate if chosen) */}
              <div className="p-5 flex-1">
                <TasksPanel
                  tasks={selectedDate ? tasks.filter((t) => t.nextDue === selectedDate) : tasks}
                  onTaskClick={(task: Task) => setSelectedTask(task)}
                />
              </div>
              {/* Bottom-right actions (visible only in list view) */}
              <div className="absolute bottom-4 right-4 flex flex-col items-end gap-2">
                {/* Print button: carers & family only */}
                {(role === 'carer' || role === 'family') && (
                  <button onClick={handlePrint} className="px-4 py-2 rounded-lg bg-white border text-black shadow hover:bg-gray-50">
                    Print
                  </button>
                )}
                {/* Back button: management & family only */}
                {(role === 'management' || role === 'family') && (
                  <button onClick={() => router.push('/clients_list')}
                    className="px-4 py-2 rounded-lg bg-orange-400 text-black font-semibold shadow-md hover:bg-orange-500">
                    Back to Client List
                  </button>
                )}
              </div>
            </>
          ) : (
            // If a task is selected → show TaskDetail view
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
      {/* Slide-in menu drawer */}
      <MenuDrawer open={open} onClose={() => setOpen(false)} />
    </div>
  );
}

/**
 * Task detail view
 * - Shows metadata, comments, files
 * - Carer/family can add comments, upload files
 * - Management is read-only (cannot edit, only view comments)
 */
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
  role: Role;
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
  // Management users are read-only
  const readOnly = role === 'management';

  return (
    <div className="flex flex-col h-full">
      {/* Header with back button */}
      <div className="bg-[#3d0000] text-white px-5 py-4 flex items-center">
        <button onClick={() => setSelectedTask(null)} className="mr-4 text-xl font-bold">←</button>
        <h2 className="text-xl font-bold">{task.title}</h2>
      </div>
      <div className="p-5 text-black flex flex-col gap-3 flex-1">
        {/* Task metadata */}
        <p><span className="font-bold">Frequency:</span> {task.frequency}</p>
        <p><span className="font-bold">Last Done:</span> {task.lastDone}</p>
        <p><span className="font-bold">Next Due:</span> {task.nextDue}</p>
        <p>
          <span className="font-bold">Status:</span>{' '}
          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusBadgeClasses(task.status)}`}>{task.status}</span>
        </p>

        {/* Comments list */}
        <div id="task-comments" className="mt-4">
          <h3 className="font-bold text-lg mb-2">Comments:</h3>
          {task.comments?.length ? (
            <ul className="list-disc pl-5 space-y-1">{task.comments.map((c, i) => <li key={i}>{c}</li>)}</ul>
          ) : <p className="italic">No comments yet.</p>}
        </div>

        {/* Files list */}
        <div className="mt-4">
          <h3 className="font-bold text-lg mb-2">Files:</h3>
          {task.files?.length ? (
            <ul className="list-disc pl-5 space-y-1">{task.files.map((f, i) => <li key={i}>{f}</li>)}</ul>
          ) : <p className="italic">No files uploaded yet.</p>}
        </div>

        {/* Comment editor (disabled for management) */}
        {!readOnly && isAddingComment && (
          <div className="mt-3 p-3 border rounded bg-white">
            <textarea className="w-full border rounded p-2 text-black"
              value={newComment} onChange={(e) => setNewComment(e.target.value)} />
            <div className="flex justify-end gap-2 mt-2">
              <button onClick={() => { setIsAddingComment(false); setNewComment(''); }} className="px-3 py-1 border rounded bg-gray-200">Cancel</button>
              <button onClick={() => newComment.trim() && addComment(task.id, newComment.trim())}
                className="px-3 py-1 border rounded bg-[#3d0000] text-white">Save</button>
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex gap-3 mt-auto flex-wrap">
          {/* Mark as done: only management & family */}
          {(role === 'management' || role === 'family') && (
            <button onClick={() => setTasks((prev) => prev.map((t) => t.id === task.id ? { ...t, status: 'Completed' } : t))}
              className="px-4 py-2 border rounded bg-white text-black">
              Mark as done
            </button>
          )}

          {/* Management: view-only mode */}
          {readOnly ? (
            <button className="px-4 py-2 border rounded bg-white text-black"
              onClick={() => document.getElementById('task-comments')?.scrollIntoView({ behavior: 'smooth' })}>
              View comments
            </button>
          ) : (
            <>
              {/* Carer/Family can add comments and upload files */}
              <button onClick={() => setIsAddingComment(true)} className="px-4 py-2 border rounded bg-white text-black">Add comment</button>
              <label className="px-4 py-2 border rounded bg-white text-black cursor-pointer">
                Upload File
                <input type="file" className="hidden" onChange={(e) => e.target.files?.length && addFile(task.id, e.target.files[0].name)} />
              </label>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
