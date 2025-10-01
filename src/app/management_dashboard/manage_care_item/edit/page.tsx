/* page purpose: the manage client task page for the management after they select specific client on the list
* feature: including select, edit, remove tasks
* Frontend author: Qingyue Zhao */

// 'use client';

// import Image from 'next/image';
// import { useEffect, useMemo, useState } from 'react';
// import { useRouter } from 'next/navigation';

// import {
//   getTasksFE,
//   saveTasksFE,
//   readActiveClientFromStorage,
//   FULL_DASH_ID,
//   NAME_BY_ID,
//   type Task as ApiTask,
//   getTaskCatalogFE,
//   getFrequencyOptionsByTaskSlugFE,
// } from '@/lib/mockApi';

// type Unit = 'day' | 'week' | 'month' | 'year';
// type Status = ApiTask['status'];

// type FrequencyOption = {
//   id: string;
//   label: string;
//   count: number;
//   unit: Unit;
// };

// const palette = {
//   pageBg: '#F5CBA7',
//   cardBg: '#F7ECD9',
//   header: '#3A0000',
//   text: '#1c130f',
//   btn: '#F39C6B',
//   btnHover: '#ef8a50',
//   danger: '#8B0000',
//   dangerHover: '#a40f0f',
//   border: '#6b3f2a',
// };

// /* ---------- frequency helpers ---------- */
// function parseFrequencyString(
//   freq?: string
// ): { count: number; unit: Unit } | null {
//   if (!freq) return null;
//   const s = freq.trim().toLowerCase();
//   const mEvery = s.match(/^every\s+(\d+)\s+(day|week|month|year)s?$/);
//   if (mEvery) return { count: Math.max(1, parseInt(mEvery[1], 10)), unit: mEvery[2] as Unit };
//   const mNum = s.match(/^(\d+)\s+(day|week|month|year)s?$/);
//   if (mNum) return { count: Math.max(1, parseInt(mNum[1], 10)), unit: mNum[2] as Unit };
//   if (s === 'daily') return { count: 1, unit: 'day' };
//   if (s === 'weekly') return { count: 1, unit: 'week' };
//   if (s === 'monthly') return { count: 1, unit: 'month' };
//   if (s === 'yearly') return { count: 1, unit: 'year' };
//   return null;
// }
// function toFrequencyString(count: number, unit: Unit): string {
//   const c = Math.max(1, Math.floor(count || 1));
//   if (c === 1) {
//     if (unit === 'day') return 'Daily';
//     if (unit === 'week') return 'Weekly';
//     if (unit === 'month') return 'Monthly';
//     if (unit === 'year') return 'Yearly';
//   }
//   return `Every ${c} ${unit}${c > 1 ? 's' : ''}`;
// }
// function normalizeClientNameForDisplay(name: string) {
//   return name.replace(/^Mock\s+/i, '').toLowerCase(); // "Mock Alice" -> "alice"
// }

// export default function ManageClientTaskPage() {
//   const router = useRouter();

//   // ---- resolve active client (no URL) ----
//   const [{ clientId, clientName }, setClientMeta] = useState<{
//     clientId: string;
//     clientName: string;
//   }>({ clientId: FULL_DASH_ID, clientName: NAME_BY_ID[FULL_DASH_ID] });

//   // ---- tasks ----
//   const [tasks, setTasks] = useState<ApiTask[]>([]);

//   // ---- catalog ----
//   const catalog = getTaskCatalogFE(); // [{category, tasks:[{label,slug}, ...]}, ...]

//   // ---- top controls ----
//   const [selectedCategory, setSelectedCategory] = useState<string>(''); // empty on first load
//   const tasksInCategory = useMemo(() => {
//     const entry = catalog.find((c) => c.category === selectedCategory);
//     return entry ? entry.tasks : [];
//   }, [catalog, selectedCategory]);

//   const [selectedTaskSlug, setSelectedTaskSlug] = useState<string>(''); // appears only after category chosen

//   // ---- selected task (once both selected) ----
//   const [selectedTask, setSelectedTask] = useState<ApiTask | null>(null);

//   // ---- fields (all rendered initially but empty & disabled until both selected) ----
//   const [status, setStatus] = useState<Status | ''>(''); // empty until load
//   const [categoryNote, setCategoryNote] = useState<string>(''); // stored in comments[0] (mock)
//   const [dateFrom, setDateFrom] = useState<string>(''); // lastDone
//   const [dateTo, setDateTo] = useState<string>(''); // nextDue

//   // frequency is still your canonical state used by save logic
//   const [frequencyCountStr, setFrequencyCountStr] = useState<string>(''); // keep empty string initially
//   const [frequencyUnit, setFrequencyUnit] = useState<Unit>('month'); // default unit

//   const statusOptions: Status[] = ['Pending', 'Due', 'Completed'];
//   const fieldsDisabled = !(selectedCategory.trim() && selectedTaskSlug.trim());

//   // ---- compute frequency dropdown options for the selected task ----
//   const frequencyOptions: FrequencyOption[] = useMemo(
//     () => getFrequencyOptionsByTaskSlugFE(selectedTaskSlug),
//     [selectedTaskSlug]
//   );

//   // Figure out which option should appear selected based on your current state
//   const selectedFrequencyId =
//     frequencyOptions.find(
//       (o) => String(o.count) === frequencyCountStr && o.unit === frequencyUnit
//     )?.id || frequencyOptions[0]?.id || '';

//   // When user picks an option, update BOTH count and unit in state
//   const onFrequencySelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
//     const nextId = e.target.value;
//     const opt = frequencyOptions.find((o) => o.id === nextId);
//     if (!opt) return;
//     setFrequencyCountStr(String(opt.count));
//     setFrequencyUnit(opt.unit);
//   };

//   // ---- init client + tasks ----
//   useEffect(() => {
//     const { id, name } = readActiveClientFromStorage();
//     const resolvedId = id || FULL_DASH_ID;
//     const resolvedName = name || NAME_BY_ID[resolvedId] || 'Mock Client';
//     setClientMeta({ clientId: resolvedId, clientName: resolvedName });

//     (async () => {
//       const all = await getTasksFE();
//       setTasks(all);
//     })();
//   }, []);

//   // ---- when category changes: reset task & clear fields to EMPTY ----
//   useEffect(() => {
//     setSelectedTaskSlug('');
//     setSelectedTask(null);
//     // clear fields to empty but keep rendered
//     setStatus('');
//     setCategoryNote('');
//     setDateFrom('');
//     setDateTo('');
//     setFrequencyCountStr('');
//     setFrequencyUnit('month');
//   }, [selectedCategory]);

//   // ---- when task slug changes: once both category & slug set, load data into fields ----
//   useEffect(() => {
//     if (!selectedCategory || !selectedTaskSlug) {
//       setSelectedTask(null);
//       setStatus('');
//       setCategoryNote('');
//       setDateFrom('');
//       setDateTo('');
//       setFrequencyCountStr('');
//       setFrequencyUnit('month');
//       return;
//     }
//     const label =
//       tasksInCategory.find((t) => t.slug === selectedTaskSlug)?.label || '';

//     if (!label) {
//       setSelectedTask(null);
//       return;
//     }
//     // Find an existing task by title match (mock rule)
//     const task =
//       tasks.find(
//         (t) => t.title?.trim().toLowerCase() === label.trim().toLowerCase()
//       ) || null;

//     setSelectedTask(task);

//     // If found, hydrate fields; otherwise keep empty (no creation on this page)
//     if (task) {
//       setStatus(task.status || '');
//       setCategoryNote(task.comments?.[0] || '');
//       const last = (task.lastDone || '').trim();
//       setDateFrom(/^\d{4}-\d{2}-\d{2}$/.test(last) ? last : '');
//       setDateTo(task.nextDue || '');
//       const parsed = parseFrequencyString(task.frequency);
//       if (parsed) {
//         setFrequencyCountStr(String(parsed.count));
//         setFrequencyUnit(parsed.unit);
//       } else {
//         setFrequencyCountStr('');
//         setFrequencyUnit('month');
//       }
//     } else {
//       // keep fields empty since no "add new" here
//       setStatus('');
//       setCategoryNote('');
//       setDateFrom('');
//       setDateTo('');
//       setFrequencyCountStr('');
//       setFrequencyUnit('month');
//     }
//   }, [selectedTaskSlug, selectedCategory, tasksInCategory, tasks]);

//   // ---- save existing task (no creation on this page) ----
//   const onDone = async () => {
//     if (!selectedTask) return; // only allow if editing existing
//     const countNum = Math.max(1, parseInt(frequencyCountStr || '1', 10));
//     const updated: ApiTask = {
//       ...selectedTask,
//       status: (status || 'Pending') as Status,
//       frequency: toFrequencyString(countNum, frequencyUnit),
//       lastDone: dateFrom || selectedTask.lastDone || '',
//       nextDue: dateTo || selectedTask.nextDue || '',
//       comments:
//         categoryNote?.trim()
//           ? [categoryNote.trim(), ...(selectedTask.comments?.slice(1) ?? [])]
//           : selectedTask.comments ?? [],
//     };
//     const next = tasks.map((t) => (t.id === updated.id ? updated : t));
//     setTasks(next);
//     await saveTasksFE(next);
//     router.push('/calender_dashboard');
//   };

//   const onRemove = async () => {
//     if (!selectedTask) return;
//     if (!confirm(`Delete "${selectedTask.title}"?`)) return;
//     const next = tasks.filter((t) => t.id !== selectedTask.id);
//     setTasks(next);
//     await saveTasksFE(next);
//     router.back();
//   };

//   //ui

//   return (
//     <main className="min-h-screen flex items-center justify-center bg-[#F5CBA7] p-6">
//       {/* logo */}
//       <Image
//         src="/logo-name.png"
//         alt="Scheduling of Care"
//         width={220}
//         height={55}
//         priority
//         className="fixed top-6 left-8"
//       />

//       <div
//         className="w-full max-w-xl rounded-[22px] border p-8 shadow relative"
//         style={{ backgroundColor: palette.cardBg, borderColor: palette.border }}
//       >
//         {/* header */}
//         <div
//           className="-mx-8 -mt-8 px-8 py-4 text-white rounded-t-[22px] border-b border-black/10 text-center"
//           style={{ backgroundColor: palette.header }}
//         >
//           <h1 className="text-3xl font-extrabold">manage client task</h1>
//         </div>

//         {/* client name line */}
//         <p className="mt-6 text-2xl font-bold text-center" style={{ color: palette.text }}>
//           <span className="font-semibold">Client Name:</span> {clientName}
//         </p>

//         {/* ===== All fields rendered from the start; values empty initially ===== */}
//         <div className="mt-6 space-y-6">
//           {/* Category at TOP (always visible) */}
//           <Field label="Category:">
//             <select
//               value={selectedCategory}
//               onChange={(e) => setSelectedCategory(e.target.value)}
//               className="w-full rounded-lg bg-white border border-[#7c5040]/40 px-3 py-2 text-lg outline-none focus:ring-4 focus:ring-[#7c5040]/20 text-black"
//             >
//               <option value="">Select a category…</option>
//               {catalog.map((c) => (
//                 <option key={c.category} value={c.category}>
//                   {c.category}
//                 </option>
//               ))}
//             </select>
//           </Field>

//           {/* Task name dropdown only AFTER category is chosen */}
//           <Field label="Task name:">
//             <select
//               value={selectedTaskSlug}
//               onChange={(e) => setSelectedTaskSlug(e.target.value)}
//               className="w-full rounded-lg bg-white border border-[#7c5040]/40 px-3 py-2 text-lg outline-none focus:ring-4 focus:ring-[#7c5040]/20 text-black"
//             >
//               <option value="">Select a task…</option>
//               {tasksInCategory.map((t) => (
//                 <option key={t.slug} value={t.slug}>
//                   {t.label}
//                 </option>
//               ))}
//             </select>
//           </Field>

//           {/* Date range (disabled until both selected) */}
//           <Field label="Date range:">
//             <div className="flex items-center gap-3">
//               <input
//                 type="date"
//                 value={dateFrom}
//                 onChange={(e) => setDateFrom(e.target.value)}
//                 disabled={fieldsDisabled}
//                 className="w-40 rounded-lg bg-white border border-[#7c5040]/40 px-3 py-2 text-lg outline-none focus:ring-4 focus:ring-[#7c5040]/20 text-black disabled:opacity-50"
//               />
//               <span className="text-lg" style={{ color: palette.text }}>
//                 to
//               </span>
//               <input
//                 type="date"
//                 value={dateTo}
//                 onChange={(e) => setDateTo(e.target.value)}
//                 min={dateFrom || undefined}
//                 disabled={fieldsDisabled}
//                 className="w-40 rounded-lg bg-white border border-[#7c5040]/40 px-3 py-2 text-lg outline-none focus:ring-4 focus:ring-[#7c5040]/20 text-black disabled:opacity-50"
//               />
//             </div>
//           </Field>

//           {/* Repeat every → SINGLE dropdown from mock API */}
//           <Field label="Repeat every:">
//             <div className="flex items-center gap-3">
//               <select
//                 value={selectedFrequencyId}
//                 onChange={onFrequencySelectChange}
//                 disabled={fieldsDisabled || frequencyOptions.length === 0}
//                 className="w-60 rounded-lg bg-white border border-[#7c5040]/40 px-3 py-2 text-lg outline-none focus:ring-4 focus:ring-[#7c5040]/20 text-black disabled:opacity-50"
//                 aria-label="Task frequency"
//               >
//                 {frequencyOptions.length === 0 ? (
//                   <option value="">No options</option>
//                 ) : (
//                   frequencyOptions.map((opt) => (
//                     <option key={opt.id} value={opt.id}>
//                       {opt.label}
//                     </option>
//                   ))
//                 )}
//               </select>
//             </div>
//           </Field>

//           {/* Status */}
//           <Field label="Status:">
//             <select
//               value={status}
//               onChange={(e) => setStatus(e.target.value as Status | '')}
//               disabled={fieldsDisabled}
//               className="w-full rounded-lg bg-white border border-[#7c5040]/40 px-3 py-2 text-lg outline-none focus:ring-4 focus:ring-[#7c5040]/20 text-black disabled:opacity-50"
//             >
//               <option value="">Select status…</option>
//               {statusOptions.map((opt) => (
//                 <option key={opt} value={opt}>
//                   {opt}
//                 </option>
//               ))}
//             </select>
//           </Field>

//           {/* Category note */}
//           <Field label="Comment:">
//             <input
//               value={categoryNote}
//               onChange={(e) => setCategoryNote(e.target.value)}
//               disabled={fieldsDisabled}
//               className="w-full rounded-lg bg-white border border-[#7c5040]/40 px-3 py-2 text-lg outline-none focus:ring-4 focus:ring-[#7c5040]/20 text-black disabled:opacity-50"
//               placeholder={fieldsDisabled ? '' : ' add notes here'}
//             />
//           </Field>
//         </div>

//         {/* banner */}
//         <div className="mt-8 -mx-8 px-8 py-5 bg-rose-300/25 text-black border border-rose-300/50">
//           <span className="font-bold mr-1">IMPORTANT:</span>
//           Deleting the task or editing the frequency and dates will change the schedule of 
//           this care item for the rest of the year. Be aware of any budget implications. 
//         </div>

//         {/* footer */}
//         <div className="mt-8 flex items-center justify-between">
//           <button
//             onClick={onRemove}
//             disabled={fieldsDisabled}
//             className="rounded-full text-white text-base font-semibold px-5 py-2 shadow disabled:opacity-60"
//             style={{ backgroundColor: palette.danger }}
//             onMouseOver={(e) => ((e.currentTarget as HTMLButtonElement).style.backgroundColor = palette.dangerHover)}
//             onMouseOut={(e) => ((e.currentTarget as HTMLButtonElement).style.backgroundColor = palette.danger)}
//           >
//             Delete Task
//           </button>

//           <div className="flex items-center gap-6">
//             <button
//               onClick={() => router.back()}
//               className="text-xl font-medium px-6 py-2 rounded-full border transition"
//               style={{ color: palette.text, borderColor: palette.text }}
//             >
//               Cancel
//             </button>
//             <button
//               onClick={onDone}
//               disabled={fieldsDisabled}
//               className="rounded-full text-xl font-bold px-8 py-2 shadow disabled:opacity-60"
//               style={{ backgroundColor: palette.btn, color: palette.text }}
//               onMouseOver={(e) => ((e.currentTarget as HTMLButtonElement).style.backgroundColor = palette.btnHover)}
//               onMouseOut={(e) => ((e.currentTarget as HTMLButtonElement).style.backgroundColor = palette.btn)}
//             >
//               Done
//             </button>
//           </div>
//         </div>
//       </div>
//     </main>
//   );
// }

// function Field({ label, children }: { label: string; children: React.ReactNode }) {
//   return (
//     <div className="grid grid-cols-[130px_1fr] items-center gap-4">
//       <div className="text-xl font-medium text-[#1c130f]">{label}</div>
//       {children}
//     </div>
//   );
// }

"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, useEffect, useMemo } from "react";
import {
  readActiveClientFromStorage,
  FULL_DASH_ID,
  NAME_BY_ID,
  getTaskCatalogFE, // <-- mock catalog for Category/Task dropdowns
} from "@/lib/mockApi";

const palette = {
  pageBg: '#F5CBA7',
  cardBg: '#F7ECD9',
  header: '#3A0000',
  text: '#1c130f',
  btn: '#F39C6B',
  btnHover: '#ef8a50',
  danger: '#8B0000',
  dangerHover: '#a40f0f',
  border: '#6b3f2a',
};

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

  // ---- NEW: Category/Task dropdown data (from mock API) ----
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
          <h1 className="text-3xl font-extrabold">Manage care items</h1>
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

          {/* Task name → dropdown (depends on selected category) */}
          <Field label="Task name:">
            <select
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              disabled={!category}
              className="w-full rounded-lg bg-white border border-[#7c5040]/40 px-3 py-2 text-lg outline-none focus:ring-4 focus:ring-[#7c5040]/20 text-black disabled:opacity-60"
            >
              <option value="">{category ? "Select a task…" : "Choose a category first"}</option>
              {tasksInCategory.map((t) => (
                <option key={t.slug} value={t.label}>
                  {t.label}
                </option>
              ))}
            </select>
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
        </div>

        {/* footer actions */}
        <div className="mt-8 flex items-center justify-between">
          <div />

          <button
            onClick={() => router.push("/dashboard")}
            className="rounded-full text-white text-base font-semibold px-5 py-2 shadow -ml-30"
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
            Delete task
          </button>

          <div className="flex items-center gap-6">
            <button
              onClick={() => router.push("/dashboard")}
              className="px-6 py-2.5 rounded-full border border-[#3A0000] text-gray-700 hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              onClick={onCreate}
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
