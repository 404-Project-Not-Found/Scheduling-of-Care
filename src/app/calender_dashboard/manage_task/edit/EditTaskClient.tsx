"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

type Unit = "day" | "week" | "month" | "year";

type Task = {
  id?: string;
  label: string;
  slug: string;
  status?: string;
  category?: string;
  clientName?: string;
  deleted?: boolean;

  // legacy string fields
  frequency?: string;
  lastDone?: string;

  // structured fields
  frequencyDays?: number;
  frequencyCount?: number;
  frequencyUnit?: Unit;
  dateFrom?: string; // YYYY-MM-DD
  dateTo?: string; // YYYY-MM-DD
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
  localStorage.setItem("tasks_version", String(Date.now()));
}

export default function EditTaskPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const slugFromURL = searchParams.get("task") ?? "";

  const clientNameFixed = "John Smith";

  const [allTasks, setAllTasks] = useState<Task[]>([]);
  const johnTasks = useMemo(
    () =>
      allTasks.filter((t) => !t.deleted && t.clientName === clientNameFixed),
    [allTasks, clientNameFixed]
  );

  const [selectedSlug, setSelectedSlug] = useState<string>(slugFromURL);

  const [status, setStatus] = useState("in progress");
  const [category, setCategory] = useState("Appointments");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [frequencyCount, setFrequencyCount] = useState<number>(10);
  const [frequencyUnit, setFrequencyUnit] = useState<Unit>("day");

  // status options
  const statusBase = [
    "in progress",
    "Completed",
    "Not started",
    "Paused",
    "Cancelled",
  ];
  const statusOptions = useMemo(
    () => (statusBase.includes(status) ? statusBase : [status, ...statusBase]),
    [status]
  );

  useEffect(() => {
    setAllTasks(loadTasks());
  }, []);

  useEffect(() => {
    if (johnTasks.length === 0) return;

    const existsInJohn = johnTasks.some((t) => t.slug === selectedSlug);
    if (!selectedSlug || !existsInJohn) {
      setSelectedSlug(johnTasks[0].slug);
    }
  }, [johnTasks.length]);

  useEffect(() => {
    if (!selectedSlug) return;
    const t = allTasks.find(
      (x) =>
        x.slug === selectedSlug &&
        x.clientName === clientNameFixed &&
        !x.deleted
    );
    if (!t) return;

    setStatus(t.status || "in progress");
    setCategory(t.category || "Appointments");

    if (typeof t.frequencyCount === "number" && t.frequencyUnit) {
      setFrequencyCount(Math.max(1, t.frequencyCount));
      setFrequencyUnit(t.frequencyUnit);
    } else {
      const parsed = parseLegacyFrequency(t.frequency);
      if (parsed) {
        setFrequencyCount(parsed.count);
        setFrequencyUnit(parsed.unit);
      } else if (t.frequencyDays) {
        setFrequencyCount(Math.max(1, t.frequencyDays));
        setFrequencyUnit("day");
      } else {
        setFrequencyCount(10);
        setFrequencyUnit("day");
      }
    }

    setDateFrom(t.dateFrom || "");
    setDateTo(t.dateTo || "");
  }, [selectedSlug, allTasks]);

  const currentTask = useMemo(
    () =>
      allTasks.find(
        (x) =>
          x.slug === selectedSlug &&
          x.clientName === clientNameFixed &&
          !x.deleted
      ) || null,
    [allTasks, selectedSlug, clientNameFixed]
  );

  const title = clientNameFixed;

  const onDone = () => {
    if (!currentTask) return;

    const updated: Task = {
      ...currentTask,

      status,
      category,
      frequencyCount: Math.max(1, frequencyCount),
      frequencyUnit,
      frequencyDays: toDays(frequencyCount, frequencyUnit),
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,

      frequency: `${frequencyCount} ${frequencyUnit}${
        frequencyCount > 1 ? "s" : ""
      }`,
      lastDone:
        dateFrom && dateTo
          ? `${dateFrom} to ${dateTo}`
          : currentTask.lastDone || "",
      deleted: false,
    };

    const next = allTasks.map((t) =>
      t.slug === currentTask.slug ? updated : t
    );
    setAllTasks(next);
    saveTasks(next);
  };

  const onRemove = () => {
    if (!currentTask) return;
    if (!confirm(`Delete "${currentTask.label}"?`)) return;

    const next = loadTasks().filter((t) => t.slug !== currentTask.slug);
    setAllTasks(next);
    saveTasks(next);

    router.back();
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-[#F5CBA7] p-6">
      {/* logo */}
      <Image
        src="/logo-name.png"
        alt="Scheduling of Care"
        width={220}
        height={55}
        priority
        className="fixed top-6 left-8"
      />

      <div className="w-full max-w-xl rounded-[22px] border border-[#6b3f2a] bg-[#F7ECD9] p-8 shadow relative">
        {/* Maroon header with centered fixed client name */}
        <div className="-mx-8 -mt-8 px-8 py-4 bg-[#3A0000] text-white rounded-t-[22px] border-b border-black/10 text-center">
          <h1 className="text-3xl font-extrabold">{title}</h1>
        </div>

        {/* Subtitle = selected care item label */}
        <h2 className="mt-4 text-2xl font-bold text-[#1c130f]">
          {currentTask ? currentTask.label : "Select a care item"}
        </h2>

        <div className="mt-8 space-y-6">
          {/* Care item selector */}
          <Field label="Care item:">
            <select
              value={selectedSlug}
              onChange={(e) => setSelectedSlug(e.target.value)}
              className="w-full rounded-lg bg-white border border-[#7c5040]/40 px-3 py-2 text-lg outline-none focus:ring-4 focus:ring-[#7c5040]/20 text-black"
            >
              {johnTasks.map((t) => (
                <option key={t.slug} value={t.slug}>
                  {t.label}
                </option>
              ))}
              {johnTasks.length === 0 && (
                <option value="">(No care items yet)</option>
              )}
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

        {/* Banner */}
        <div className="mt-8 -mx-8 px-8 py-5 bg-rose-300/25 text-black border border-rose-300/50">
          <span className="font-bold mr-1">IMPORTANT:</span>
          Deleting the task or editing the frequency and dates will change the
          schedule of this care item for the rest of the year. Be aware of any
          budget implications caused by this change. Make this change?
        </div>

        {/* Footer */}
        <div className="mt-8 flex items-center justify-between">
          <button
            onClick={onRemove}
            disabled={!currentTask}
            className="rounded-full bg-[#8B0000] hover:bg-[#a40f0f] disabled:opacity-60 text-white text-base font-semibold px-5 py-2 shadow"
          >
            Delete Task
          </button>

          <div className="flex items-center gap-6">
            <button
              onClick={() => router.back()}
              className="text-xl font-medium text-[#1c130f] border border-[#1c130f] px-6 py-2 rounded-full hover:bg-gray-100 transition"
            >
              Cancel
            </button>
            <button
              onClick={onDone}
              disabled={!currentTask}
              className="rounded-full bg-[#F39C6B] hover:bg-[#ef8a50] disabled:opacity-60 text-[#1c130f] text-xl font-bold px-8 py-2 shadow"
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
