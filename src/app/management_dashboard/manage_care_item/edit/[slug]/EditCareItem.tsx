/**
 * File path: /app/management_dashboard/manage_care_item/edit//EditCareItem.tsx
 * Frontend Author: Qingyue Zhao
 * Backend Author: Zahra Rizqita
 * Last Update: 2025-10-04
 *
 * Description:
 * - This page provides the "Edit Care Item" form for management users.
 * - Built on top of the shared <DashboardChrome /> component to ensure consistent
 *   layout and navigation across the application.
 * - Allows selecting the active client, and creating a new care task with details:
 *   category, name, date range, repeat interval, status, etc.
 * - Tasks are stored in localStorage (mock mode) and persisted across reloads.
 * - Buttons at the bottom support Cancel (navigate back) and Add (save task).
 * 
 * Updates:
 * - Backend and frontend integrated, Mock API no longer works and only real API
 * - 
 */
"use client";

import { useRouter } from 'next/navigation';
import { useState, useEffect, useMemo } from 'react';
import DashboardChrome from '@/components/top_menu/client_schedule';
import { type CareItemOption } from '@/lib/catalog';
import { useActiveClient } from '@/context/ActiveClientContext';
import {
  getClients,
  getActiveClient,
  Client as ApiClient,
} from '@/lib/data';


type UiClient = {id: string; name: string};

type Unit = 'day' | 'week' | 'month' | 'year';

type Task = {
  label: string;
  slug: string;
  status: string;
  category: string;
  clientName?: string;
  clientId?: string;
  deleted?: boolean;
  frequency?: string;
  frequencyDays?: number;
  frequencyCount?: number;
  frequencyUnit?: Unit;
  dateFrom?: string;
  dateTo?: string;
  notes?: string;
};


const unitToDays: Record<Unit, number> = {
  day: 1,
  week: 7,
  month: 30,
  year: 365,
};
const toDays = (count: number, unit: Unit) =>
  Math.max(1, Math.floor(count || 1)) * unitToDays[unit];

const chromeColors = {
  header: '#3A0000',
  banner: '#F9C9B1',
  text: '#2b2b2b',
  pageBg: '#FAEBDC',
};

type Client = { id: string; name: string };
type CatalogItem = {category: string; tasks: {label: string; slug: string}[]};


export default function EditCareItem({slug} : {slug: string}) {
  const router = useRouter();
  const cleanSlug = (slug || '').trim().toLowerCase();

  // Topbar client list
  const [clients, setClients] = useState<Client[]>([]);
  const { client, handleClientChange, resetClient } = useActiveClient();
  const activeId = client.id;
  const activeName = client.name;

  // State
  const [careItemOptions, setCareItemOptions] = useState<CareItemOption[]>([]);
  const [careItemLoading, setCareItemLoading] = useState(false);

  // Form states
  const [label, setLabel] = useState('');
  const [status, setStatus] = useState('in progress');
  const [category, setCategory] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [notes, setNotes] = useState('');

  const [frequencyCountStr, setFrequencyCountStr] = useState<string>('');
  const [frequencyUnit, setFrequencyUnit] = useState<Unit>('day');

  // ---- keep dropdown logic: Category → Task name ----
  const [catalog, setCatalog] = useState<CatalogItem[]>([]);
  const tasksInCategory = useMemo(() => {
    const entry = catalog.find((c) => c.category === category);
    return entry ? entry.tasks : [];
  }, [catalog, category]);

  const [itemSlug, setItemSlug] = useState<string>('');

  // Load client
  useEffect(() => {
    (async () => {
      try {
        const list: ApiClient[] = await getClients();
        const mapped: UiClient[] = list.map(c => ({ id: c._id, name: c.name }));
        setClients(mapped);
        
        const active = await getActiveClient();
        if (active.id) {
          handleClientChange(active.id, active.name);
        } 
        else {
          resetClient();
        }
      } catch {
        setClients([]);
        resetClient();
      }
    })();
  }, []);

  //Load categories -- updated to scope client on 10/10/2025
  useEffect(() => {
    (async() => {
      try {
        if(!activeId) {setCatalog([]); return;}
        const url = new URL('/api/v1/category', window.location.origin);
        url.searchParams.set('clientId', activeId);
        const res = await fetch(url.toString(), {cache: 'no-store'});
        if(!res.ok) throw new Error("Failed to load category -- Editing task");
        const data: Array<{ name: string; slug: string }> = await res.json();
        setCatalog(data.map((c) => ({category: c.name, tasks: []})));
      } catch {
        setCatalog([]);
      }
    }
    )();
  }, [activeId]);

  // Ensure selected category stays selected
  useEffect(() => {
    if(!category) return;
    if(!catalog.some(c => c.category === category)) {setCatalog(prev => [{category, tasks: []}, ...prev])}
  }, [catalog, category]);

  //Load care items by slug
  useEffect(() => {
    if(!slug || clients.length === 0) return;
    (async() => {   
        const res = await fetch(`/api/v1/care_item/${encodeURIComponent(cleanSlug)}`, { cache: 'no-store' });
        if(!res.ok) {
          const msg: {error?: string} = await res.json().catch(() => ({}));
          alert(`Cannot load care item: ${msg.error || res.statusText}`);
          router.back();
          return;
        }

        const t: Task = await res.json();
        setItemSlug((t.slug || '').trim().toLowerCase());

        setLabel(t.label || "");
        setStatus((statusOptions.includes(t.status as any) ? t.status : 'in progress') as typeof status);
        setCategory((t.category || "").trim());
        if(typeof t.frequencyCount === "number" && t.frequencyUnit) {
          setFrequencyCountStr(String(t.frequencyCount));
          setFrequencyUnit(t.frequencyUnit);
        }
        else {
          setFrequencyCountStr('');
          setFrequencyUnit('day');
        }
        if(t.dateFrom) setDateFrom(t.dateFrom);
        if(t.dateTo) setDateTo(t.dateTo);
        setNotes(t.notes ?? '');

        if(t.clientId) {
          const match = clients.find(c => c.id === t.clientId);
          if(match) {
            if (match) handleClientChange(match.id, match.name);
          }
        }
        else if(t.clientName && !activeName) {
          handleClientChange(client.id ?? '', t.clientName);
        }
      })(); 
  }, [cleanSlug, clients]);

  // Fetching catalog
  useEffect(() => {
  let cancelled = false;
  (async () => {
    if (!category.trim()) { setCareItemOptions([]); return; }
    if(!activeId) {setCareItemOptions([]); return;}
    setCareItemLoading(true);
    try {
      const res = await fetch(`/api/v1/task_catalog?clientId=${encodeURIComponent(activeId)}&category=${encodeURIComponent(category)}`, { cache: "no-store" });
      if (!res.ok) throw new Error("failed");
      const data: { category: string; tasks: CareItemOption[] } = await res.json();

      // Safety de-dupe (belt & braces)
      const seen = new Set<string>();
      const uniq: CareItemOption[] = [];
      for (const t of data.tasks ?? []) {
        const norm = t.label.trim().toLowerCase().replace(/\s+/g, " ");
        if (seen.has(norm)) continue;
        seen.add(norm);
        uniq.push({ label: t.label, slug: t.slug });
      }
      setCareItemOptions(uniq);
    } catch {
      setCareItemOptions([]);
    } finally {
      if (!cancelled) setCareItemLoading(false);
    }
  })();
  return () => { cancelled = true; };
}, [category]);

  const onClientChange = (id: string) => {
    const c = clients.find(x => x.id === id);
    handleClientChange(id, c?.name || '');
  };



  const statusOptions = useMemo(
    () => ['in progress', 'Completed', 'Not started', 'Paused', 'Cancelled'],
    []
  );

  const palette = {
    danger: '#8B0000',
    dangerHover: '#a40f0f',
  };


  const onDelete = async () => {
    const slugForDel = (itemSlug || cleanSlug);
    if(!slugForDel) {alert("Missing task slug -- cannot delete"); return;}
    if (!confirm('Discard this task and go back?')) return;

    const res = await fetch(`/api/v1/care_item/${encodeURIComponent(slugForDel)}`, { method: 'DELETE'});
    if(!res.ok) {
      const msg = await res.json().catch(() => ({}));
      alert(`Delete failed: ${msg?.error || res.statusText}`);
      return;
    }
    router.push('/calendar_dashboard');
  };

  const onSave = async () => {
    const slugForSave = (itemSlug || cleanSlug);

    if(!activeId) {alert('Please select a client first.'); return;}
    if(!slugForSave) {alert("Missing Task Slug -- cannot proceed"); return;}
    
    const name = label.trim();
    if (!name) {alert('Please enter the task name.'); return;}
    if (!category.trim()) {alert('Please select a category.'); return;}

    const countNum = parseInt(frequencyCountStr, 10);
    const hasFrequency = Number.isFinite(countNum) && countNum > 0;

    const payload: Partial<Task> & {
      clientId?: string | null;
      clientName?: string;
    } = {
      clientId: activeId ?? undefined,
      clientName: activeName || undefined,
      label: name,
      status: status.trim(),
      category: category.trim(),
      frequencyCount: hasFrequency ? countNum : undefined,
      frequencyUnit: hasFrequency ? (frequencyUnit as Unit) : undefined,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
      notes: notes.trim() || undefined,
      deleted: false,
    };

    const res = await fetch(`/api/v1/care_item/${encodeURIComponent(slugForSave)}`, {
      method: 'PUT',    
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(payload),
    });

    if(!res.ok) {
      const msg = await res.json().catch(() => ({}));
      alert(`Save failed: ${msg?.error || res.statusText}`);
      return;
    }
    router.push('/calendar_dashboard');
  };

  const onLogoClick = () => {
    router.push('/empty_dashboard');
  };

  return (
    <DashboardChrome
      page="care-edit"
      clients={clients}
      activeClientId={activeId}
      activeClientName={activeName}
      onClientChange={onClientChange}
      colors={chromeColors}
      onLogoClick={onLogoClick}
    >
      {/* Fill entire area below the topbar */}
      <div className="w-full h-[720px] bg-[#FAEBDC] flex flex-col">
        {/* Section title bar */}
        <div className="bg-[#3A0000] text-white px-6 py-3">
          <h2 className="text-xl md:text-3xl font-extrabold px-5">
            Edit Care Item
          </h2>
        </div>

        {/* Notice bar */}
        <div className="bg-[#F9C9B1] text-black px-6 py-4">
          <h3 className="text-lg px-5">
            <strong>IMPORTANT:</strong> Deleting the task or editing the
            frequency and dates will change the schedule of this care item for
            the rest of the year. Be aware of any budget implications before
            making this change!!
          </h3>
        </div>

        {/* Form content */}
        <div className="flex-1 p-8 text-xl">
          <div className="space-y-6 max-w-3xl mx-auto">
            {/* Category (dropdown) */}
            <Field label="Category">
              <select
                key={activeId || 'no-client'}
                value={category}
                onChange={(e) => {
                  setCategory(e.target.value.trim());
                  setLabel(''); // reset task when category changes
                }}
                className="w-full rounded-lg bg-white border border-[#7c5040]/40 px-3 py-2 text-lg outline-none focus:ring-4 focus:ring-[#7c5040]/20 text-black"
              >
                <option value="">Select a category…</option>
                {catalog.map((c: { category: string }) => (
                  <option key={c.category} value={c.category}>
                    {c.category}
                  </option>
                ))}
              </select>
            </Field>

            {/* Task name (dropdown depends on category) */}
            <Field label="Task Name">
              {careItemLoading ? (
                <div className="text-sm opacity-70">Loading tasks…</div>
              ) : careItemOptions.length > 0 ? (
                <select
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  disabled={!category}
                  className="w-full rounded-lg bg-white border border-[#7c5040]/40 px-3 py-2 text-lg outline-none focus:ring-4 focus:ring-[#7c5040]/20 text-black disabled:opacity-60"
                >
                  <option value="">{category ? "Select a task…" : "Choose a category first"}</option>
                  {careItemOptions.map((t) => (
                    <option key={t.slug} value={t.label}>{t.label}</option>
                  ))}
                </select>
              ) : (
                <input
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  className="w-full rounded-lg bg-white border border-[#7c5040]/40 px-3 py-2 text-lg outline-none focus:ring-4 focus:ring-[#7c5040]/20 text-black"
                  placeholder={category ? "Enter a task name…" : "Choose a category first"}
                  disabled={!category}
                />
              )}
            </Field>

            <Field label="Date Range">
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

            <Field label="Repeat Every">
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={frequencyCountStr}
                  onChange={(e) =>
                    setFrequencyCountStr(e.target.value.replace(/[^\d]/g, ''))
                  }
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

            <Field label="Status">
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

            <Field label="Notes">
              <input
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full rounded-lg bg-white border border-[#7c5040]/40 px-3 py-2 text-lg outline-none focus:ring-4 focus:ring-[#7c5040]/20 text-black"
                placeholder="e.g., add notes for this care item here"
              />
            </Field>

            {/* Footer buttons */}
            <div className="pt-2 flex items-center justify-center gap-30">
              <button
                onClick={onDelete}
                className="rounded-full text-white text-xl font-semibold px-6.5 py-2.5 shadow"
                style={{ backgroundColor: palette.danger }}
              >
                Delete
              </button>
              <button
                onClick={() => router.push('/calendar_dashboard')}
                className="px-6 py-2.5 rounded-full border border-[#3A0000] text-gray-700 hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={onSave}
                className="rounded-full bg-[#F39C6B] hover:bg-[#ef8a50] text-[#1c130f] text-xl font-bold px-7.5 py-2.5 shadow"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      </div>
    </DashboardChrome>
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
    <div className="grid grid-cols-[180px_1fr] items-center gap-4">
      <div className="text-xl font-semibold text-[#1c130f]">{label}</div>
      {children}
    </div>
  );
}