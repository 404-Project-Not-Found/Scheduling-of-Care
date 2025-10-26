/**
 * File path: /management_dashboard/manage_care_item/edit/page.tsx
 * Front-end Author: Qingyue Zhao
 * Back-end Author: Zahra Rizqita
 *
 * Updated by Denise Alexander (16/10/2025): Fixed active client usage, client dropdown
 * now works correctly.
 *
 * Last Updated by Denise Alexander (20/10/2025): UI design and layout changes for readability,
 * consistency and better navigation.
 */

'use client';

import { AlertCircle } from 'lucide-react';

import { useRouter } from 'next/navigation';
import { useState, useEffect, useMemo } from 'react';
import DashboardChrome from '@/components/top_menu/client_schedule';
import { type CareItemOption } from '@/lib/catalog';
import {
  getViewerRole,
  getClients,
  getActiveClient,
  setActiveClient,
  type Client as ApiClient,
} from '@/lib/data';

// --------- Type Definitions ---------
type Role = 'carer' | 'family' | 'management';

type ClientLite = {
  id: string;
  name: string;
  orgAccess?: 'approved' | 'pending' | 'revoked';
};

type ApiClientWithAccess = ApiClient & {
  orgAccess?: 'approved' | 'pending' | 'revoked';
};

type UiClient = { id: string; name: string };

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
  lastDone?: string;
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
type CatalogItem = {
  category: string;
  tasks: { label: string; slug: string }[];
};

export default function EditSelectorPage() {
  const router = useRouter();

  // State
  const [careItemOptions, setCareItemOptions] = useState<CareItemOption[]>([]);
  const [loadingTasks, setLoadingTasks] = useState(false);

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

  /* ------------------------------ Role ------------------------------ */
  const [role, setRole] = useState<Role>('carer'); // default

  useEffect(() => {
    (async () => {
      try {
        const r = await getViewerRole();
        setRole(r);
      } catch (err) {
        console.error('Failed to get role.', err);
        setRole('carer'); // fallback
      }
    })();
  }, []);

  /* ---------------------------- Clients ----------------------------- */
  const [clients, setClients] = useState<ClientLite[]>([]);
  const [activeClientId, setActiveClientId] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState<string>('');

  // Load clients + active client on mount
  useEffect(() => {
    (async () => {
      try {
        const list: ApiClient[] = await getClients();
        const mapped: ClientLite[] = (list as ApiClientWithAccess[]).map(
          (c) => ({
            id: c._id,
            name: c.name,
            orgAccess: c.orgAccess,
          })
        );
        setClients(mapped);

        const active = await getActiveClient();
        setActiveClientId(active.id);
        setDisplayName(active.name || '');
      } catch (err) {
        console.error('Failed to fetch clients.', err);
        setClients([]);
        setActiveClientId(null);
        setDisplayName('');
      }
    })();
  }, []);

  // Change active client (persists with helper)
  const onClientChange = async (id: string) => {
    if (!id) {
      setActiveClientId(null);
      setDisplayName('');
      await setActiveClient(null);
      return;
    }
    const c = clients.find((x) => x.id === id);
    const name = c?.name || '';
    setActiveClientId(id);
    setDisplayName(name);
    await setActiveClient(id, name);
  };

  //Load categories -- updated to scope client on 10/10/2025
  useEffect(() => {
    (async () => {
      try {
        if (!activeClientId) {
          setCatalog([]);
          return;
        }
        const url = new URL(
          `/api/v1/clients/${activeClientId}/category`,
          window.location.origin
        );
        url.searchParams.set('clientId', activeClientId);
        const res = await fetch(url.toString(), { cache: 'no-store' });
        if (!res.ok) throw new Error('Failed to load category -- Editing task');
        const data: Array<{ name: string; slug: string }> = await res.json();
        setCatalog(data.map((c) => ({ category: c.name, tasks: [] })));
      } catch {
        setCatalog([]);
      }
    })();
  }, [activeClientId]);

  // Load task suggestions when category changes
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!activeClientId || !category.trim()) {
        setCareItemOptions([]);
        return;
      }
      setLoadingTasks(true);
      try {
        const res = await fetch(
          `/api/v1/task_catalog?clientId=${encodeURIComponent(activeClientId)}&category=${encodeURIComponent(category)}`,
          { cache: 'no-store' }
        );
        if (!res.ok) throw new Error('failed');
        const data: { category: string; tasks: CareItemOption[] } =
          await res.json();
        const seen = new Set<string>();
        const uniq: CareItemOption[] = [];
        for (const t of data.tasks ?? []) {
          const norm = t.label.trim().toLowerCase().replace(/\s+/g, ' ');
          if (seen.has(norm)) continue;
          seen.add(norm);
          uniq.push({ label: t.label, slug: t.slug });
        }
        if (!cancelled) setCareItemOptions(uniq);
      } catch {
        if (!cancelled) setCareItemOptions([]);
      } finally {
        if (!cancelled) setLoadingTasks(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [activeClientId, category]);

  // When task is chosen: push to /edit/[slug]
  const handleTaskPick = async (value: string) => {
    setLabel(value);
    const option = careItemOptions.find((t) => t.label === value);
    if (option?.slug) {
      router.push(
        `/management_dashboard/manage_care_item/edit/${encodeURIComponent(option.slug)}`
      );
      return;
    }

    if (activeClientId && category && value) {
      const url = new URL(
        `/api/v1/clients/${activeClientId}/care_item`,
        window.location.origin
      );
      url.searchParams.set('clientId', activeClientId);
      url.searchParams.set('category', category);
      url.searchParams.set('q', value);
      url.searchParams.set('limit', '1');
      const res = await fetch(url.toString(), { cache: 'no-store' });
      if (res.ok) {
        const hits: Array<{ slug: string }> = await res.json();
        if (hits[0]?.slug) {
          router.push(
            `/management_dashboard/manage_care_item/edit/${encodeURIComponent(hits[0].slug)}`
          );
          return;
        }
      }
      alert('Could not find a matching care item to edit.');
    }
  };

  const statusOptions = useMemo(
    () => ['in progress', 'Completed', 'Not started', 'Paused', 'Cancelled'],
    []
  );

  const palette = {
    danger: '#8B0000',
    dangerHover: '#a40f0f',
  };

  return (
    <DashboardChrome
      page="care-edit-picker"
      clients={clients}
      onClientChange={onClientChange}
      colors={chromeColors}
    >
      {/* Fill entire area below the topbar */}
      <div className="w-full bg-[#FFF5EC] px-6 py-5">
        {/* Section title bar */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <h2 className="text-[#3A0000] text-3xl font-semibold">
            Edit Care Item
          </h2>
        </div>

        {/* Divider */}
        <hr className="mt-4 mb-2 w-340 mx-auto border-t border-[#3A0000]/25 rounded-full" />

        {/* Notice bar */}
        <div className="mt-6 mb-10 mx-auto flex items-start gap-4 bg-[#F9C9B1]/60 border border-[#3A0000]/30 rounded-xl px-6 py-3 shadow-sm">
          <AlertCircle
            size={28}
            strokeWidth={2.5}
            className="text-[#3A0000] flex-shrink-0 mt-1"
          />
          <div className="text-[#3A0000]">
            <h3 className="text-lg font-semibold mb-1">Important Notice</h3>
            <p className="text-base leading-relaxed">
              Deleting the task or editing the frequency and dates will change
              the schedule of this care item for the rest of the year. Please
              consider any budget implications before making these changes.
            </p>
          </div>
        </div>

        {/* Form content */}
        <div className="flex-1 p-2 text-xl">
          <div className="space-y-6 max-w-3xl mx-auto">
            {/* Category (dropdown) */}
            <Field label="Category">
              <select
                key={activeClientId || 'no-client'}
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
              {loadingTasks ? (
                <div className="text-sm opacity-70">Loading tasks…</div>
              ) : careItemOptions.length > 0 ? (
                <select
                  value={label}
                  onChange={(e) => handleTaskPick(e.target.value)}
                  disabled={!category}
                  className="w-full rounded-lg bg-white border border-[#7c5040]/40 px-3 py-2 text-lg outline-none focus:ring-4 focus:ring-[#7c5040]/20 text-black disabled:opacity-60"
                >
                  <option value="">
                    {category ? 'Select a task…' : 'Choose a category first'}
                  </option>
                  {careItemOptions.map((t) => (
                    <option key={t.slug} value={t.label}>
                      {t.label}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  className="w-full rounded-lg bg-white border border-[#7c5040]/40 px-3 py-2 text-lg outline-none focus:ring-4 focus:ring-[#7c5040]/20 text-black"
                  placeholder={
                    category ? 'Enter a task name…' : 'Choose a category first'
                  }
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
                //onClick={onDelete}
                className="px-5 py-2.5 rounded-md text-lg font-medium text-white bg-[#B3261E] hover:bg-[#99201A] transition"
              >
                Delete
              </button>
              <button
                onClick={() => router.push('/calendar_dashboard')}
                className="px-5 py-2.5 rounded-md text-lg font-medium text-[#3A0000] bg-[#F3E9DF] border border-[#D8C6B9] hover:bg-[#E9DED2] transition"
              >
                Cancel
              </button>
              <button
                //onClick={onSave}
                className="px-5 py-2.5 rounded-md text-lg font-medium text-white bg-[#3A0000] hover:bg-[#502121] transition"
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