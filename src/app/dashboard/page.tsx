"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import CalendarPanel from "@/components/dashboard/CalendarPanel";
import TasksPanel from "@/components/tasks/TasksPanel";
import { MenuDrawer } from "@/app/menu/page";
import { Task } from "./types";

export default function DashboardPage() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [tasks, setTasks] = useState<Task[]>([
    {
      id: "1",
      title: "Dental Appointment",
      frequency: "Monthly",
      lastDone: "2025-09-15",
      nextDue: "2025-10-01",
      status: "Pending",
      comments: [],
      files: [],
    },
    {
      id: "2",
      title: "Replace Toothbrush Head",
      frequency: "Every 3 months",
      lastDone: "2025-07-13",
      nextDue: "2025-10-13",
      status: "Pending",
      comments: [],
      files: [],
    },
    {
      id: "3",
      title: "Submit Report",
      frequency: "Weekly",
      lastDone: "2025-09-18",
      nextDue: "2025-09-25",
      status: "Due",
      comments: [],
      files: [],
    },
  ]);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isAddingComment, setIsAddingComment] = useState(false);
  const [newComment, setNewComment] = useState("");

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    if (open) document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  const filteredTasks =
    selectedDate === ""
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
    setNewComment("");
    setIsAddingComment(false);
  };

  const addFile = (taskId: string, fileName: string) => {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? { ...t, files: [...(t.files || []), fileName] }
          : t
      )
    );
    setSelectedTask((prev) =>
      prev ? { ...prev, files: [...(prev.files || []), fileName] } : prev
    );
  };

  return (
    <div className="min-h-screen relative">
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
                  <span className="font-bold">Frequency:</span>{" "}
                  {selectedTask.frequency}
                </p>
                <p>
                  <span className="font-bold">Last Done:</span>{" "}
                  {selectedTask.lastDone}
                </p>
                <p>
                  <span className="font-bold">Next Due:</span>{" "}
                  {selectedTask.nextDue}
                </p>
                <p>
                  <span className="font-bold">Status:</span>{" "}
                  {selectedTask.status}
                </p>

                {/* Comments Section */}
                <div className="mt-4">
                  <h3 className="font-bold text-lg mb-2">Comments:</h3>
                  {selectedTask.comments && selectedTask.comments.length > 0 ? (
                    <ul className="list-disc pl-5 space-y-1">
                      {selectedTask.comments.map((c, idx) => (
                        <li key={idx} className="text-black">
                          {c}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-black italic">No comments yet.</p>
                  )}
                </div>

                {/* Files Section */}
                <div className="mt-4">
                  <h3 className="font-bold text-lg mb-2">Files:</h3>
                  {selectedTask.files && selectedTask.files.length > 0 ? (
                    <ul className="list-disc pl-5 space-y-1">
                      {selectedTask.files.map((f, idx) => (
                        <li key={idx} className="text-black">
                          {f}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-black italic">No files uploaded yet.</p>
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
                          setNewComment("");
                        }}
                      >
                        Cancel
                      </button>
                      <button
                        className="px-3 py-1 border rounded bg-[#3d0000] text-white"
                        onClick={() => {
                          if (newComment.trim()) {
                            addComment(selectedTask.id, newComment.trim());
                          }
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
                    onClick={() =>
                      setSelectedTask({ ...selectedTask, status: "Completed" })
                    }
                  >
                    Mark as done
                  </button>

                  <button
                    className="px-4 py-2 border rounded bg-white text-black"
                    onClick={() => setIsAddingComment(true)}
                  >
                    Add comment
                  </button>

                  {/* Upload File */}
                  <label className="px-4 py-2 border rounded bg-white text-black cursor-pointer">
                    Upload File
                    <input
                      type="file"
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files?.length && selectedTask) {
                          const file = e.target.files[0];
                          addFile(selectedTask.id, file.name);
                        }
                      }}
                    />
                  </label>

                  {/* Upload Receipt → Navigate to /add_transaction */}
                  <button
                    className="px-4 py-2 border rounded bg-white text-black"
                    onClick={() => router.push("/add_transaction")}
                  >
                    Upload Receipt
                  </button>
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
