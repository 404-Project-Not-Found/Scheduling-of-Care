"use client";

import Image from "next/image";
// import { useRouter } from "next/navigation";
import { useState } from "react";

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
  // const router = useRouter();

  // all fields default to empty
  const [clientName, setClientName] = useState("");
  const [label, setLabel] = useState("");
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

  const onCreate = () => {
    const name = label.trim();
    if (!name) {
      alert("Please enter the task name.");
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
      clientName: clientName.trim() || undefined,
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
    // router.push("/task/search");
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
          <h1 className="text-3xl font-extrabold">Create new task</h1>
        </div>

        {/* form fields */}
        <div className="mt-8 space-y-6">
          <Field label="Client name:">
            <input
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              className="w-full rounded-lg bg-white border border-[#7c5040]/40 px-3 py-2 text-lg outline-none focus:ring-4 focus:ring-[#7c5040]/20 text-black"
              placeholder="e.g., John Smith"
            />
          </Field>

          <Field label="Task name:">
            <input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              className="w-full rounded-lg bg-white border border-[#7c5040]/40 px-3 py-2 text-lg outline-none focus:ring-4 focus:ring-[#7c5040]/20 text-black"
              placeholder="e.g., Replace Toothbrush Head"
            />
          </Field>

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

          {/* status dropdown */}
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

          <Field label="Category:">
            <input
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full rounded-lg bg-white border border-[#7c5040]/40 px-3 py-2 text-lg outline-none focus:ring-4 focus:ring-[#7c5040]/20 text-black"
              placeholder="e.g., Appointments"
            />
          </Field>
        </div>

        {/* footer actions */}
        <div className="mt-8 flex items-center justify-between">
          <div />
          <div className="flex items-center gap-6">
            <button
              // onClick={() => router.push("/task/search")}
              className="text-xl font-medium text-[#1c130f] hover:opacity-80"
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
