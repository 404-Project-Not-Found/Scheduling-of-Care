/* page purpose: the manage care item page for the management
* feature: including select, edit, remove tasks
* Frontend author: Qingyue Zhao */

"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, useEffect, useMemo } from "react";
import {
  readActiveClientFromStorage,
  FULL_DASH_ID,
  NAME_BY_ID,
  getTaskCatalogFE, // dropdown data (mock)
} from "@/lib/mockApi";

type Unit = "day" | "week" | "month" | "year";

type Task = {
  label: string;
  slug: string;
  status: string;
  category: string;
  clientName?: string;
  deleted?: boolean;

  // legacy string fields
  frequency?: string;
  lastDone?: string;

  // structured fields
  frequencyDays?: number;
  frequencyCount?: number;
  frequencyUnit?: Unit;
  dateFrom?: string;
  dateTo?: string;
};

function saveTasks(tasks: Task[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem("tasks", JSON.stringify(tasks));
}
function loadTasks(): Task[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem("tasks") || "[]") as Task[];
  } catch {
    return [];
  }
}

// ---- palette for the red Delete button (match previous style) ----
const palette = {
  danger: "#8B0000",
  dangerHover: "#a40f0f",
};

const unitToDays: Record<Unit, number> = {
  day: 1,
  week: 7,
  month: 30,
  year: 365,
};
function toDays(count: number, unit: Unit) {
  return Math.max(1, Math.floor(count || 1)) * unitToDays[unit];
}
function slugify(s: string) {
  return s
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export default function AddTaskPage() {
  const router = useRouter();

  // client name from mockApi (active client)
  const [clientName, setClientName] = useState<string>("");
  useEffect(() => {
    const { id, name } = readActiveClientFromStorage();
    const resolvedId = id || FULL_DASH_ID;
    const resolvedName = name || NAME_BY_ID[resolvedId] || "";
    setClientName(resolvedName);
  }, []);

  // all fields default to empty
  const [label, setLabel] = useState("");
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState("in progress");
  const [category, setCategory] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  // frequency: allow empty input; keep as string then parse on submit
  const [frequencyCountStr, setFrequencyCountStr] = useState<string>("");
  const [frequencyUnit, setFrequencyUnit] = useState<Unit>("day");

  const statusOptions = [
    "in progress",
    "Completed",
    "Not started",
    "Paused",
    "Cancelled",
  ];

  // Category/Task dropdown data (from mock API)
  const catalog = useMemo(() => getTaskCatalogFE(), []);
  const tasksInCategory = useMemo(() => {
    const entry = catalog.find((c) => c.category === category);
    return entry ? entry.tasks : [];
  }, [catalog, category]);

  const onCreate = () => {
    const name = label.trim();
    if (!name) {
      alert("Please select the task name.");
      return;
    }
    if (!category.trim()) {
      alert("Please select a category.");
      return;
    }

    const tasks = loadTasks();

    const base = slugify(name) || "task";
    let slug = base;
    let i = 2;
    while (tasks.some((t) => t.slug === slug)) {
      slug = `${base}-${i++}`;
    }

    const countNum = parseInt(frequencyCountStr, 10);
    const hasFrequency = Number.isFinite(countNum) && countNum > 0;
    const frequencyDays = hasFrequency
      ? toDays(countNum, frequencyUnit)
      : undefined;
    const legacyStr = hasFrequency
      ? `${countNum} ${frequencyUnit}${countNum > 1 ? "s" : ""}`
      : undefined;

    const newTask: Task = {
      clientName,
      label: name,
      slug,
      status: status.trim(),
      category: category.trim(),
      frequencyCount: hasFrequency ? countNum : undefined,
      frequencyUnit: hasFrequency ? frequencyUnit : undefined,
      frequencyDays,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
      frequency: legacyStr,
      lastDone: dateFrom && dateTo ? `${dateFrom} to ${dateTo}` : "",
      deleted: false,
    };

    saveTasks([...(tasks || []), newTask]);
    router.push("/calender_dashboard");
  };

  // red Delete button behavior (bottom-left)
  const onDeleteDraft = () => {
    if (!confirm("Discard this new task and go back?")) return;
    router.back();
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-[#F5CBA7] p-6">
      {/* logo top-left */}
      <Image
        src="/logo-name.png"
        alt="Scheduling of Care"
        width={220}
        height={55}
        priority
        className="fixed top-6 left-8"
      />

      <div className="w-full max-w-xl rounded-[22px] border border-[#6b3f2a] bg-[#F7ECD9] p-8 shadow relative">
        {/* top bar */}
        <div className="-mx-8 -mt-8 px-8 py-4 bg-[#3A0000] text-white rounded-t-[22px] border-b border-black/10 text-center">
          <h1 className="text-3xl font-extrabold">Manage Care Items</h1>
        </div>

        {/* client name line */}
        <p className="mt-6 text-2xl font-bold text-center text-black">
          <span className="font-semibold">Client Name:</span> {clientName}
        </p>

        {/* form fields */}
        <div className="mt-8 space-y-6">
          {/* Category → dropdown */}
          <Field label="Category:">
            <select
              value={category}
              onChange={(e) => {
                setCategory(e.target.value);
                // reset task name when category changes
                setLabel("");
              }}
              className="w-full rounded-lg bg-white border border-[#7c5040]/40 px-3 py-2 text-lg outline-none focus:ring-4 focus:ring-[#7c5040]/20 text-black"
            >
              <option value="">Select a category…</option>
              {catalog.map((c) => (
                <option key={c.category} value={c.category}>
                  {c.category}
                </option>
              ))}
            </select>
          </Field>

          {/* Task name → dropdown */}
          <Field label="Task name:">
            <select
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              disabled={!category}
              className="w-full rounded-lg bg-white border border-[#7c5040]/40 px-3 py-2 text-lg outline-none focus:ring-4 focus:ring-[#7c5040]/20 text-black disabled:opacity-60"
            >
              <option value="">
                {category ? "Select a task…" : "Choose a category first"}
              </option>
              {tasksInCategory.map((t) => (
                <option key={t.slug} value={t.label}>
                  {t.label}
                </option>
              ))}
            </select>
          </Field>

          {/* Date range */}
          <Field label="Date range:">
            <div className="flex items-center gap-3">
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-40 rounded-lg bg-white border border-[#7c5040]/40 px-3 py-2 text-lg outline-none focus:ring-4 focus:ring-[#7c5040]/20 text-black"
              />
              <span className="text-[#1c130f] text-lg">to</span>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                min={dateFrom || undefined}
                className="w-40 rounded-lg bg-white border border-[#7c5040]/40 px-3 py-2 text-lg outline-none focus:ring-4 focus:ring-[#7c5040]/20 text-black"
              />
            </div>
          </Field>

          {/* Repeat every */}
          <Field label="Repeat every:">
            <div className="flex items-center gap-3">
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={frequencyCountStr}
                onChange={(e) => {
                  const v = e.target.value.replace(/[^\d]/g, "");
                  setFrequencyCountStr(v);
                }}
                className="w-28 rounded-lg bg-white border border-[#7c5040]/40 px-3 py-2 text-lg outline-none focus:ring-4 focus:ring-[#7c5040]/20 text-black"
                placeholder="e.g., 90"
              />
              <select
                value={frequencyUnit}
                onChange={(e) => setFrequencyUnit(e.target.value as Unit)}
                className="w-40 rounded-lg bg-white border border-[#7c5040]/40 px-3 py-2 text-lg outline-none focus:ring-4 focus:ring-[#7c5040]/20 text-black"
              >
                <option value="day">day(s)</option>
                <option value="week">week(s)</option>
                <option value="month">month(s)</option>
                <option value="year">year(s)</option>
              </select>
            </div>
          </Field>

          {/* Status */}
          <Field label="Status:">
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full rounded-lg bg-white border border-[#7c5040]/40 px-3 py-2 text-lg outline-none focus:ring-4 focus:ring-[#7c5040]/20 text-black"
            >
              {statusOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </Field>

          {/* Comment / Notes (INSIDE the card) */}
          <Field label="Comment:">
            <input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full rounded-lg bg-white border border-[#7c5040]/40 px-3 py-2 text-lg outline-none focus:ring-4 focus:ring-[#7c5040]/20 text-black"
              placeholder={" add notes here"}
            />
          </Field>

          {/* IMPORTANT banner (INSIDE the card) */}
          <div className="mt-8 -mx-8 px-8 py-5 bg-rose-300/25 text-black border border-rose-300/50 rounded-b-[0]">
            <span className="font-bold mr-1">IMPORTANT:</span>
            Deleting the task or editing the frequency and dates will change the schedule of
            this care item for the rest of the year. Be aware of any budget implications.
          </div>
        </div>

        {/* footer actions (INSIDE the card) */}
        <div className="mt-8 flex items-center justify-between">
          {/* LEFT: red Delete button */}
          <button
            onClick={onDeleteDraft}
            className="rounded-full text-white text-base font-semibold px-5 py-2 shadow"
            style={{ backgroundColor: palette.danger }}
            onMouseOver={(e) =>
              ((e.currentTarget as HTMLButtonElement).style.backgroundColor =
                palette.dangerHover)
            }
            onMouseOut={(e) =>
              ((e.currentTarget as HTMLButtonElement).style.backgroundColor =
                palette.danger)
            }
          >
            Delete
          </button>

          {/* RIGHT: Cancel / Create */}
          <div className="flex items-center gap-6">
            <button
              onClick={() => router.push("/calender_dashboard")}
              className="px-6 py-2.5 rounded-full border border-[#3A0000] text-gray-700 hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              onClick={onCreate}
              className="rounded-full bg-[#F39C6B] hover:bg-[#ef8a50] text-[#1c130f] text-xl font-bold px-8 py-2 shadow"
            >
              Create
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid grid-cols-[130px_1fr] items-center gap-4">
      <div className="text-xl font-medium text-[#1c130f]">{label}</div>
      {children}
    </div>
  );
}
