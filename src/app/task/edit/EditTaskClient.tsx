"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

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
  frequencyDays?: number; // normalized to days
  frequencyCount?: number; // user-entered number
  frequencyUnit?: Unit; // user-chosen unit
  dateFrom?: string; // YYYY-MM-DD
  dateTo?: string; // YYYY-MM-DD
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

// ---- frequency helpers ----
const unitToDays: Record<Unit, number> = {
  day: 1,
  week: 7,
  month: 30, // simple approximation
  year: 365, // simple approximation
};

function toDays(count: number, unit: Unit) {
  return Math.max(1, Math.floor(count || 1)) * unitToDays[unit];
}

function parseLegacyFrequency(
  freq?: string
): { count: number; unit: Unit } | null {
  if (!freq) return null;
  const m = freq
    .trim()
    .toLowerCase()
    .match(/^(\d+)\s*(day|days|week|weeks|month|months|year|years)$/);
  if (!m) return null;
  const n = Math.max(1, parseInt(m[1], 10));
  const u = m[2].replace(/s$/, "") as Unit;
  return { count: n, unit: u };
}

export default function EditTaskPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const taskSlug = searchParams.get("task") ?? "";

  // structured state
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [frequencyCount, setFrequencyCount] = useState<number>(10);
  const [frequencyUnit, setFrequencyUnit] = useState<Unit>("day");

  // other fields
  const [clientName, setClientName] = useState("John Smith"); // default filled value (not placeholder)
  const [status, setStatus] = useState("in progress");
  const [category, setCategory] = useState("Appointments");
  const [label, setLabel] = useState("Replace Toothbrush Head");

  // status options for dropdown; if current status isn't in the list, include it as first option
  const statusOptionsBase = [
    "in progress",
    "Completed",
    "Not started",
    "Paused",
    "Cancelled",
  ];
  const statusOptions = statusOptionsBase.includes(status)
    ? statusOptionsBase
    : [status, ...statusOptionsBase];

  useEffect(() => {
    const tasks = loadTasks();
    const t = tasks.find((x) => x.slug === taskSlug);
    if (!t) return;

    setLabel(t.label || label);
    setClientName(t.clientName || clientName);
    setStatus(t.status || status);
    setCategory(t.category || category);

    // prefer structured frequency
    if (typeof t.frequencyCount === "number" && t.frequencyUnit) {
      setFrequencyCount(Math.max(1, t.frequencyCount));
      setFrequencyUnit(t.frequencyUnit);
    } else {
      // fallback to legacy string like "90 days"
      const parsed = parseLegacyFrequency(t.frequency);
      if (parsed) {
        setFrequencyCount(parsed.count);
        setFrequencyUnit(parsed.unit);
      } else if (t.frequencyDays) {
        // crude back-conversion if only days were stored
        setFrequencyCount(Math.max(1, t.frequencyDays));
        setFrequencyUnit("day");
      }
    }

    if (t.dateFrom) setDateFrom(t.dateFrom);
    if (t.dateTo) setDateTo(t.dateTo);
    if (!t.dateFrom && !t.dateTo && t.lastDone?.includes(" to ")) {
      const [from, to] = t.lastDone.split(" to ").map((s) => s.trim());
      if (from) setDateFrom(from);
      if (to) setDateTo(to);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [taskSlug]);

  const displayTitle = useMemo(
    () => (label ? label : taskSlug ? humanize(taskSlug) : "Edit Task"),
    [label, taskSlug]
  );

  const onDone = () => {
    const tasks = loadTasks();
    const idx = tasks.findIndex((x) => x.slug === taskSlug);
    if (idx >= 0) {
      const days = toDays(frequencyCount, frequencyUnit);
      const legacyStr = `${frequencyCount} ${frequencyUnit}${
        frequencyCount > 1 ? "s" : ""
      }`;

      tasks[idx] = {
        ...tasks[idx],
        clientName: clientName.trim() || undefined,
        status,
        category,
        // structured fields
        frequencyCount: Math.max(1, frequencyCount),
        frequencyUnit,
        frequencyDays: days,
        dateFrom,
        dateTo,
        // legacy fields for compatibility
        frequency: legacyStr,
        lastDone:
          dateFrom && dateTo
            ? `${dateFrom} to ${dateTo}`
            : tasks[idx].lastDone || "",
        deleted: false,
      };

      saveTasks(tasks);
    }
    // router.push("/task/search");
  };

  const onRemove = () => {
    const tasks = loadTasks();
    const idx = tasks.findIndex((x) => x.slug === taskSlug);
    if (idx >= 0) {
      tasks[idx].deleted = true;
      saveTasks(tasks);
    }
    // router.push("/task/search");
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-[#F5CBA7] p-6">
      {/* screen top-left logo (outside the card) */}
      <Image
        src="/logo-name.png"
        alt="Scheduling of Care"
        width={220}
        height={55}
        priority
        className="fixed top-6 left-8"
      />

      <div className="w-full max-w-xl rounded-[22px] border border-[#6b3f2a] bg-[#F7ECD9] p-8 shadow relative">
        <div className="-mx-8 -mt-8 px-8 py-4 bg-[#3A0000] text-white rounded-t-[22px] border-b border-black/10 text-center">
          <h1 className="text-3xl font-extrabold">Edit task</h1>
        </div>

        <h2 className="mt-4 text-2xl font-bold text-[#1c130f]">
          {displayTitle}
        </h2>

        <div className="mt-8 space-y-6">
          {/* Client name */}
          <Field label="Client name:">
            <input
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              className="w-full rounded-lg bg-white border border-[#7c5040]/40 px-3 py-2 text-lg outline-none focus:ring-4 focus:ring-[#7c5040]/20 text-black"
            />
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

          {/* Frequency count + unit */}
          <Field label="Repeat every:">
            <div className="flex items-center gap-3">
              <input
                type="number"
                min={1}
                step={1}
                value={Number.isFinite(frequencyCount) ? frequencyCount : 1}
                onChange={(e) =>
                  setFrequencyCount(
                    Math.max(1, parseInt(e.target.value || "1", 10))
                  )
                }
                className="w-28 rounded-lg bg-white border border-[#7c5040]/40 px-3 py-2 text-lg outline-none focus:ring-4 focus:ring-[#7c5040]/20 text-black"
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

          {/* Status - dropdown */}
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

          {/* Category */}
          <Field label="Category:">
            <input
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full rounded-lg bg-white border border-[#7c5040]/40 px-3 py-2 text-lg outline-none focus:ring-4 focus:ring-[#7c5040]/20 text-black"
              placeholder="e.g., Appointments"
            />
          </Field>
        </div>

        <div className="mt-8 -mx-8 px-8 py-5 bg-rose-300/25 text-black border border-rose-300/50">
          <span className="font-bold mr-1">IMPORTANT:</span>
          Deleting the task or editing the frequency and dates will change the
          schedule of this care item for the rest of the year. Be aware of any
          budget implications caused by this change. Make this change?
        </div>

        <div className="mt-8 flex items-center justify-between">
          <button
            onClick={onRemove}
            className="rounded-full bg-[#8B0000] hover:bg-[#a40f0f] text-white text-base font-semibold px-5 py-2 shadow"
          >
            Delete Task
          </button>

          <div className="flex items-center gap-6">
            <button
              // onClick={() => router.push("/task/search")}
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
