/**
 * File path: /app/management_dashboard/manage_care_item/add/page.tsx
 * Frontend Author: Qingyue Zhao
 * Backend Author: Zahra Rizqita
 * Last Update: 2025-10-02
 *
 * Description:
 * - This page provides the "Add New Care Item" form for management users.
 * - Built on top of the shared <DashboardChrome /> component to ensure consistent
 *   layout and navigation across the application.
 * - Allows selecting the active client, and creating a new care task with details:
 *   category, name, date range, repeat interval, status, etc.
 * - Tasks are stored in localStorage (mock mode) and persisted across reloads.
 * - Buttons at the bottom support Cancel (navigate back) and Add (save task).
 *
 * Last Updated by Denise Alexander (16/10/2025): Fixed active client usage, client dropdown
 * now works correctly.
 */

'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect, useMemo } from 'react';
import DashboardChrome from '@/components/top_menu/client_schedule';
import { fetchCareItemCatalog, type CareItemOption } from '@/lib/catalog';
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

type CatalogItem = {
  category: string;
  tasks: { label: string; slug: string }[];
};

const chromeColors = {
  header: '#3A0000',
  banner: '#F9C9B1',
  text: '#2b2b2b',
  pageBg: '#FAEBDC',
};

export default function AddTaskPage() {
  const router = useRouter();

  // Added catalog implementation
  const [catalog, setCatalog] = useState<CatalogItem[]>([]);

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

  // Load categories
  useEffect(() => {
    (async () => {
      try {
        if (!activeClientId) {
          setCatalog([]);
          return;
        }

        const url = new URL('/api/v1/category', window.location.origin);
        url.searchParams.set('clientId', activeClientId);

        const res = await fetch(url.toString(), { cache: 'no-store' });
        if (!res.ok) throw new Error('Failed to load categories');

        const data: Array<{ name: string; slug: string }> = await res.json();
        setCatalog(data.map((c) => ({ category: c.name, tasks: [] })));
      } catch {
        setCatalog([]);
      }
    })();
  }, [activeClientId]);

  // Fetching catalog
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!category.trim()) {
        setCareItemOptions([]);
        return;
      }
      if (!activeClientId) {
        setCareItemOptions([]);
        return;
      }
      setCareItemLoading(true);

      try {
        const res = await fetch(
          `/api/v1/task_catalog?clientId=${encodeURIComponent(activeClientId)}&category=${encodeURIComponent(category)}`,
          { cache: 'no-store' }
        );
        if (!res.ok) throw new Error('failed -- task catalog');
        const data: { category: string; tasks: CareItemOption[] } =
          await res.json();

        // Safety de-dupe (belt & braces)
        const seen = new Set<string>();
        const uniq: CareItemOption[] = [];
        for (const t of data.tasks ?? []) {
          const norm = t.label.trim().toLowerCase().replace(/\s+/g, ' ');
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
    return () => {
      cancelled = true;
    };
  }, [category]);

  const statusOptions = useMemo(() => ['Pending', 'Due', 'Completed'], []);

  const onCreate = async () => {
    if (!activeClientId) {
      alert('Please select a client first.');
      return;
    }

    const name = label.trim();
    if (!name) {
      alert('Please enter the task name.');
      return;
    }
    if (!category.trim()) {
      alert('Please enter a category.');
      return;
    }

    const countNum = parseInt(frequencyCountStr, 10);
    const hasFrequency = Number.isFinite(countNum) && countNum > 0;

    const payload = {
      clientId: activeClientId ?? undefined,
      clientName: displayName,
      label: name,
      status: status.trim().toLowerCase(),
      category: category.trim(),
      frequencyCount: hasFrequency ? countNum : undefined,
      frequencyUnit: hasFrequency ? frequencyUnit : undefined,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
      notes: notes.trim() || undefined,
    };

    try {
      const res = await fetch('/api/v1/care_item', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const msg = await res.json().catch(() => ({}));
        alert(`Adding task failed: ${msg?.error || res.statusText}`);
        return;
      }

      router.push('/calendar_dashboard');
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : String(e);
      alert(`Network error: ${message}`);
    }
  };

  return (
    <DashboardChrome
      page="care-add"
      clients={clients}
      onClientChange={onClientChange}
      colors={chromeColors}
    >
      {/* Fill entire area below the topbar */}
      <div className="w-full h-[720px] bg-[#FAEBDC] flex flex-col">
        {/* Section title bar */}
        <div className="bg-[#3A0000] text-white px-6 py-3">
          <h2 className="text-xl md:text-3xl font-extrabold px-5">
            Add New Care Item
          </h2>
        </div>

        {/* Form content */}
        <div className="flex-1 p-16 text-xl">
          <div className="space-y-6 max-w-3xl mx-auto">
            <Field label="Care Item Sub Category">
              <input
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                className="w-full rounded-lg bg-white border border-[#7c5040]/40 px-3 py-2 text-lg outline-none focus:ring-4 focus:ring-[#7c5040]/20 text-black"
                placeholder="e.g., Replace Toothbrush Head"
              />
            </Field>

            <Field label="Category">
              <input
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-lg bg-white border border-[#7c5040]/40 px-3 py-2 text-lg outline-none focus:ring-4 focus:ring-[#7c5040]/20 text-black"
                placeholder="e.g., Appointments"
              />
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
            <div className="pt-6 flex items-center justify-center gap-30">
              <button
                onClick={() => router.push('/calendar_dashboard')}
                className="px-6 py-2.5 rounded-full border border-[#3A0000] text-gray-700 hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={onCreate}
                className="rounded-full bg-[#F39C6B] hover:bg-[#ef8a50] text-[#1c130f] text-xl font-bold px-8 py-2.5 shadow"
              >
                Add
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
