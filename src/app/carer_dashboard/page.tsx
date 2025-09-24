'use client';

import { Suspense, useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import CalendarPanel from '@/components/dashboard/CalendarPanel';
import TasksPanel from '@/components/tasks/TasksPanel';
import { MenuDrawer } from '@/app/menu/carer/page';
import { Task } from './types';

// Wrap the page in Suspense
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

  const [open, setOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>('');

  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isAddingComment, setIsAddingComment] = useState(false);
  const [newComment, setNewComment] = useState('');

  const [showHelp, setShowHelp] = useState(false); // help tooltip visibility

  // Close menu on Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    if (open) document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  // Load tasks from localStorage (or defaults)
  useEffect(() => {
    const stored = localStorage.getItem('tasks');
    if (stored) {
      setTasks(JSON.parse(stored));
    } else {
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
    }
  }, []);

  // Persist tasks
  useEffect(() => {
    if (tasks.length > 0) localStorage.setItem('tasks', JSON.stringify(tasks));
  }, [tasks]);

  // Add file via ?addedFile query param
  const hasAddedFile = useRef(false);
  useEffect(() => {
    if (addedFile && selectedTask && !hasAddedFile.current) {
      addFile(selectedTask.id, addedFile);
      hasAddedFile.current = true;
    }
  }, [addedFile, selectedTask]);

  const filteredTasks =
    selectedDate === ''
      ? tasks
      : tasks.filter((t) => t.nextDue === selectedDate);

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

  // Dashboard instructions for help tooltip
  const instructions = [
    'Click the ≡ button to open the menu.',
    'Calendar: Click a date to filter tasks due on that day.',
    'Tasks Panel: Click a task to view details.',
    "Mark a task as done using the 'Mark as done' button.",
    "Add comments using 'Add comment'.",
    "Upload files with 'Upload File'.",
    'Use the transactions link to view or add receipts.',
  ];

  return (
    <div className="min-h-screen relative">
      {/* Help Button */}
      <div className="fixed bottom-8 right-8 z-50">
        <button
          className="w-10 h-10 rounded-full text-white font-bold text-lg relative peer"
          style={{ backgroundColor: '#ed5f4f' }}
        >
          ?
        </button>

        {/* Tooltip */}
        <div className="absolute bottom-14 right-0 w-80 p-4 bg-white border border-gray-400 rounded shadow-lg text-black text-sm opacity-0 peer-hover:opacity-100 transition-opacity pointer-events-none">
          <h3 className="font-bold mb-2">Dashboard Help</h3>
          <ul className="list-disc list-inside space-y-1">
            <li>
              Click the <span className="font-bold">≡</span> button to open menu
              options.
            </li>
            <li>
              Menu options allow you to update user details, view cost report
              page, and access transaction history.
            </li>
            <li>
              Click a{' '}
              <span className="text-blue-600 font-semibold">
                highlighted date in blue
              </span>{' '}
              on the calendar to see tasks due that day.
            </li>
            <li>
              The{' '}
              <span className="text-red-500 font-semibold">
                red highlighted day
              </span>{' '}
              shows the current day.
            </li>
            <li>Click a task in the right panel to view its details.</li>
            <li>
              Use <span className="font-bold">Mark as done</span> to complete a
              task.
            </li>
            <li>
              Use <span className="font-bold">Add comment</span> to leave notes
              on a task.
            </li>
            <li>
              Use <span className="font-bold">Upload File</span> to attach files
              to tasks.
            </li>
            <li>
              Click{' '}
              <span className="font-bold underline text-blue-600 cursor-pointer">
                transactions
              </span>{' '}
              to view or add receipts.
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
            <div className="flex items-center gap-3">
              <span>Florence Edwards</span>
              <Link href="/client-profile">
                <div className="h-10 w-10 rounded-full bg-gray-300 border border-white flex items-center justify-center text-sm font-semibold text-gray-700 cursor-pointer hover:opacity-80">
                  F
                </div>
              </Link>
            </div>
          </div>
          <div className="p-5 flex-1 relative">
            <CalendarPanel
              tasks={tasks}
              onDateClick={(date: string) => setSelectedDate(date)}
            />
          </div>
        </section>

        {/* RIGHT: Task Panel */}
        <section className="flex flex-col rounded-2xl overflow-hidden bg-[#F7ECD9] border border-black/10">
          {!selectedTask ? (
            <>
              <div className="bg-[#3d0000] text-white px-5 py-6">
                <h2 className="text-2xl font-semibold">Tasks</h2>
              </div>
              <div className="p-5 flex-1">
                <TasksPanel
                  tasks={filteredTasks}
                  onTaskClick={(task: Task) => setSelectedTask(task)}
                />
              </div>
            </>
          ) : (
            <div className="flex flex-col h-full">
              <div className="bg-[#3d0000] text-white px-5 py-4 flex items-center">
                <button
                  onClick={() => setSelectedTask(null)}
                  className="mr-4 text-xl font-bold"
                >
                  ←
                </button>
                <h2 className="text-xl font-bold">{selectedTask.title}</h2>
              </div>

              <div className="p-5 text-black flex flex-col gap-3 flex-1">
                <p>
                  <span className="font-bold">Frequency:</span>{' '}
                  {selectedTask.frequency}
                </p>
                <p>
                  <span className="font-bold">Last Done:</span>{' '}
                  {selectedTask.lastDone}
                </p>
                <p>
                  <span className="font-bold">Next Due:</span>{' '}
                  {selectedTask.nextDue}
                </p>
                <p>
                  <span className="font-bold">Status:</span>{' '}
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusBadgeClasses(selectedTask.status)}`}
                  >
                    {selectedTask.status}
                  </span>
                </p>

                {/* Comments Section */}
                <div className="mt-4">
                  <h3 className="font-bold text-lg mb-2">Comments:</h3>
                  {selectedTask.comments && selectedTask.comments.length > 0 ? (
                    <ul className="list-disc pl-5 space-y-1">
                      {selectedTask.comments.map((c, idx) => (
                        <li key={idx}>{c}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="italic">No comments yet.</p>
                  )}
                </div>

                {/* Files Section */}
                <div className="mt-4">
                  <h3 className="font-bold text-lg mb-2">Files:</h3>
                  {selectedTask.files && selectedTask.files.length > 0 ? (
                    <ul className="list-disc pl-5 space-y-1">
                      {selectedTask.files.map((f, idx) => (
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
                          if (newComment.trim())
                            addComment(selectedTask.id, newComment.trim());
                        }}
                      >
                        Save
                      </button>
                    </div>
                  </div>
                )}

                {/* Action buttons row */}
                <div className="flex gap-3 mt-auto flex-wrap">
                  <button
                    className="px-4 py-2 border rounded bg-white text-black"
                    onClick={() => {
                      if (selectedTask) {
                        setTasks((prev) =>
                          prev.map((t) =>
                            t.id === selectedTask.id
                              ? { ...t, status: 'Completed' }
                              : t
                          )
                        );
                        setSelectedTask({
                          ...selectedTask,
                          status: 'Completed',
                        });
                      }
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
                        if (e.target.files?.length && selectedTask)
                          addFile(selectedTask.id, e.target.files[0].name);
                      }}
                    />
                  </label>

                  <div className="mt-2 text-black text-sm">
                    Need to add a receipt/view receipts? Go to{' '}
                    <span
                      className="underline cursor-pointer text-blue-600 hover:text-blue-800"
                      onClick={() => router.push('/transaction_history')}
                    >
                      transactions
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>
      </div>

      <MenuDrawer open={open} onClose={() => setOpen(false)} />
    </div>
  );
}
