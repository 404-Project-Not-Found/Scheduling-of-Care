"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

type Task = {
  label: string;
  slug: string;
  frequency: string;
  lastDone: string;
  status: string;
  category: string;
  deleted?: boolean;
};

function humanize(slug: string) {
  return slug.replace(/-/g, " ").replace(/\b\w/g, (s) => s.toUpperCase());
}

function loadTasks(): Task[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem("tasks") || "[]") as Task[];
  } catch {
    return [];
  }
}
function saveTasks(tasks: Task[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem("tasks", JSON.stringify(tasks));
}

export default function EditTaskPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const taskSlug = searchParams.get("task") ?? "";

  const [frequency, setFrequency] = useState("every 3 months");
  const [lastDone, setLastDone] = useState("23rd April 2025");
  const [status, setStatus] = useState("Completed");
  const [category, setCategory] = useState("Appointments");
  const [label, setLabel] = useState("Replace Toothbrush Head");

  // Load existing values from storage on mount
  useEffect(() => {
    const tasks = loadTasks();
    const t = tasks.find((x) => x.slug === taskSlug);
    if (t) {
      setLabel(t.label);
      setFrequency(t.frequency);
      setLastDone(t.lastDone);
      setStatus(t.status);
      setCategory(t.category);
    }
  }, [taskSlug]);

  const displayTitle = useMemo(
    () => (label ? label : taskSlug ? humanize(taskSlug) : "Edit Task"),
    [label, taskSlug]
  );

  const onDone = () => {
    const tasks = loadTasks();
    const idx = tasks.findIndex((x) => x.slug === taskSlug);
    if (idx >= 0) {
      tasks[idx] = {
        ...tasks[idx],
        frequency,
        lastDone,
        status,
        category,
        deleted: false,
      };
      saveTasks(tasks);
    }
    router.push("/task/search");
  };

  const onRemove = () => {
    const tasks = loadTasks();
    const idx = tasks.findIndex((x) => x.slug === taskSlug);
    if (idx >= 0) {
      tasks[idx].deleted = true;
      saveTasks(tasks);
    }
    router.push("/task/search");
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-[#F5CBA7] p-6">
      <div className="w-full max-w-xl rounded-[22px] border border-[#6b3f2a] bg-[#F7ECD9] p-8 shadow relative">
        {/* Top bar */}
        <div className="-mx-8 -mt-8 px-8 py-4 bg-[#3A0000] text-white rounded-t-[22px] border-b border-black/10 text-center">
          <h1 className="text-3xl font-extrabold">Edit task</h1>
        </div>

        <h2 className="mt-4 text-2xl font-bold text-[#1c130f]">{displayTitle}</h2>

        <div className="mt-8 space-y-6">
          <Field label="Frequency:">
            <input
              value={frequency}
              onChange={(e) => setFrequency(e.target.value)}
              className="w-full rounded-lg bg-white border border-[#7c5040]/40 px-3 py-2 text-lg outline-none focus:ring-4 focus:ring-[#7c5040]/20 text-black placeholder:text-black placeholder:opacity-100 caret-black"
              placeholder="e.g., every 3 months"
            />
          </Field>

          <Field label="Last done:">
            <input
              value={lastDone}
              onChange={(e) => setLastDone(e.target.value)}
              className="w-full rounded-lg bg-white border border-[#7c5040]/40 px-3 py-2 text-lg outline-none focus:ring-4 focus:ring-[#7c5040]/20 text-black placeholder:text-black placeholder:opacity-100 caret-black"
              placeholder="e.g., 23 April 2025"
            />
          </Field>

          <Field label="Status:">
            <input
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full rounded-lg bg-white border border-[#7c5040]/40 px-3 py-2 text-lg outline-none focus:ring-4 focus:ring-[#7c5040]/20 text-black placeholder:text-black placeholder:opacity-100 caret-black"
              placeholder="e.g., Completed"
            />
          </Field>

          <Field label="Category:">
            <input
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full rounded-lg bg-white border border-[#7c5040]/40 px-3 py-2 text-lg outline-none focus:ring-4 focus:ring-[#7c5040]/20 text-black placeholder:text-black placeholder:opacity-100 caret-black"
              placeholder="e.g., Appointments"
            />
          </Field>
        </div>

        {/* Bottom banner */}
        <div className="mt-8 -mx-8 px-8 py-5 bg-rose-300/25 text-black border border-rose-300/50">
          Editing the frequency and dates will change the schedule of this care
          item for the rest of the year. Be aware of any budget implications
          caused by this change. Make this change?
        </div>

        {/* Footer actions */}
        <div className="mt-8 flex items-center justify-between">
          <button
            onClick={onRemove}
            className="rounded-full bg-[#8B0000] hover:bg-[#a40f0f] text-white text-base font-semibold px-5 py-2 shadow"
          >
            Delete Task
          </button>

          <div className="flex items-center gap-6">
            <button
              onClick={() => router.push("/task/search")}
              className="text-xl font-medium text-[#1c130f] hover:opacity-80"
            >
              Cancel
            </button>
            <button
              onClick={onDone}
              className="rounded-full bg-[#F39C6B] hover:bg-[#ef8a50] text-[#1c130f] text-xl font-bold px-8 py-2 shadow"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[130px_1fr] items-center gap-4">
      <div className="text-xl font-medium text-[#1c130f]">{label}</div>
      {children}
    </div>
  );
}
