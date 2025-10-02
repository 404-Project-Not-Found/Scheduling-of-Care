'use client';

/**
 * Budget Report Page 
 * - Keeps the same dark-brown header and the pink utility banner as your calendar dashboard.
 * - Client dropdown, centered title, and Print button are preserved.
 * - Role and client data are all sourced from /src/lib/mockApi.ts.
 */

import React, { Suspense, useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Badge from '@/components/ui/Badge';

// ==== Pull data from mockApi ====
import {
  getViewerRoleFE,
  getClientsFE,
  readActiveClientFromStorage,
  writeActiveClientToStorage,
  type Client as ApiClient,
} from '@/lib/mockApi';

// Demo rows; if you later compute from tasks/transactions, replace these with real data.
type Row = { item: string; category: string; allocated: number; spent: number };
const rows: Row[] = [
  { item: 'Dental Appointments', category: 'Appointments', allocated: 600, spent: 636 },
  { item: 'Toothbrush Heads',    category: 'Hygiene',      allocated: 30,  spent: 28  },
  { item: 'Socks',               category: 'Clothing',     allocated: 176, spent: 36  },
];

type Tone = 'green' | 'yellow' | 'red';
const getStatus = (remaining: number): { tone: Tone; label: string } => {
  if (remaining < 0) return { tone: 'red',    label: 'Exceeded' };
  if (remaining <= 5) return { tone: 'yellow', label: 'Nearly Exceeded' };
  return { tone: 'green', label: 'Within Limit' };
};

// ---------- Shared palette ----------
const palette = {
  header: '#3A0000',   // dark brown header
  text:   '#2b2b2b',
  pageBg: '#FAEBDC',
};

// HEX → RGBA helper for the semi-transparent banner
function hexToRgba(hex: string, alpha = 1) {
  const h = hex.replace('#', '');
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export default function BudgetReportPage() {
  return (
    <Suspense fallback={<div className="p-6 text-gray-600">Loading budget report...</div>}>
      <BudgetReportInner />
    </Suspense>
  );
}

function BudgetReportInner() {
  const router = useRouter();

  // ======== Role (from mockApi) ========
  const role = getViewerRoleFE(); // 'family' | 'carer' | 'management'
  const isManagement = role === 'management';

  // ======== Client selection in the pink banner (from mockApi) ========
  type Client = { id: string; name: string };
  const [clients, setClients] = useState<Client[]>([]);
  const [activeClientId, setActiveClientId] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState<string>('');
  const [openProfileMenu, setOpenProfileMenu] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        // Fetch client list (auto routes to mock or real backend)
        const list = await getClientsFE(); // ApiClient[]
        const mapped: Client[] = list.map((c: ApiClient) => ({ id: c._id, name: c.name }));
        setClients(mapped);

        // Restore current selection from storage (provided by mockApi)
        const { id, name } = readActiveClientFromStorage();
        if (id) {
          setActiveClientId(id);
          setDisplayName(name || mapped.find(m => m.id === id)?.name || '');
        }
      } catch {
        // Non-blocking on error; leaving the list empty is fine for UI
        setClients([]);
      }
    })();
  }, []);

  const onClientChange = (id: string) => {
    if (!id) {
      setActiveClientId(null);
      setDisplayName('');
      return;
    }
    const c = clients.find((x) => x.id === id);
    const name = c?.name || '';
    setActiveClientId(id);
    setDisplayName(name);
    // Persist to storage so other pages share the same selection
    writeActiveClientToStorage(id, name);
  };

  const handleLogoClick = () => {
    // Same routing rule as your existing app: family → partial, others → calendar dashboard
    if (role === 'family') router.push('/empty_dashboard');
    else router.push('/calender_dashboard');
  };

  const onPrint = () => {
    if (typeof window !== 'undefined') window.print();
  };

  // ======== Local state for the budget report content ========
  const [q, setQ] = useState('');
  const [year, setYear] = useState('2025');

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return rows;
    return rows.filter(
      (r) => r.item.toLowerCase().includes(t) || r.category.toLowerCase().includes(t)
    );
  }, [q]);

  const totals = useMemo(() => {
    const allocated = filtered.reduce((s, r) => s + r.allocated, 0);
    const spent = filtered.reduce((s, r) => s + r.spent, 0);
    return { allocated, spent, remaining: allocated - spent };
  }, [filtered]);

  return (
    <div className="min-h-screen flex flex-col" style={{ color: palette.text }}>
      {/* ===== Top dark header ===== */}
      <header
        className="px-5 py-4 flex items-center justify-between text-white"
        style={{ backgroundColor: palette.header }}
      >
        {/* Left: Logo (click → dashboard) + Title */}
        <div className="flex items-center gap-4">
          <button
            onClick={handleLogoClick}
            className="inline-flex items-center justify-center"
            aria-label="Go to dashboard"
            title="Dashboard"
          >
            <Image
              src="/logo.png"
              alt="App Logo"
              width={72}
              height={72}
              className="object-contain"
            />
          </button>
          <span className="font-extrabold leading-none text-2xl md:text-3xl">
            Client Schedule
          </span>
        </div>

        {/* Center: top nav */}
        <nav className="hidden lg:flex items-center gap-8 font-extrabold text-white">
          <Link href="/calender_dashboard/budget_report" className="underline underline-offset-4">
            Budget Report
          </Link>
          <Link href="/calender_dashboard/transaction_history" className="hover:opacity-90">
            Transaction History
          </Link>

          {/* Management-only: Care Items dropdown */}
          {isManagement && (
            <div className="relative group">
              <button className="hover:opacity-90" aria-haspopup="menu" aria-expanded="false" type="button">
                Care Items
              </button>
              <div
                className="absolute left-0 top-full mt-2 w-56 rounded-xl border bg-white text-black shadow-md opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition"
                role="menu"
              >
                <Link
                  href="/management_dashboard/manage_care_item/edit"
                  className="block w-full text-left px-5 py-3 text-sm font-semibold hover:bg-black/5"
                  role="menuitem"
                >
                  Edit Care Item
                </Link>
                <Link
                  href="/management_dashboard/manage_care_item/add"
                  className="block w-full text-left px-5 py-3 text-sm font-semibold hover:bg-black/5"
                  role="menuitem"
                >
                  Create / Add Care Item
                </Link>
              </div>
            </div>
          )}
        </nav>

        {/* Right: profile avatar dropdown */}
        <div className="relative">
          <button
            onClick={() => setOpenProfileMenu((v) => !v)}
            aria-haspopup="menu"
            aria-expanded={openProfileMenu}
            className="h-10 w-10 rounded-full bg-gray-300 border border-white flex items-center justify-center text-sm font-semibold text-gray-700 hover:opacity-90"
            title="Profile"
          >
            {/* Use a default profile image if you have one */}
            <Image
              src="/default_profile.png"
              alt="Profile"
              width={40}
              height={40}
              className="rounded-full object-cover"
            />
          </button>
          {openProfileMenu && (
            <div className="absolute right-0 mt-2 w-56 rounded-xl border bg-white text-black shadow-md" role="menu">
              <Link
                href="/calender_dashboard/update_details"
                className="block w-full text-left px-5 py-3 text-sm font-semibold hover:bg-black/5"
                role="menuitem"
              >
                Update Your Details
              </Link>
              <Link href="/" className="block w-full text-left px-5 py-3 text-sm font-semibold hover:bg-black/5" role="menuitem">
                Sign out
              </Link>
            </div>
          )}
        </div>
      </header>

      {/* ===== Pink banner under header: Select Client / Title / Print ===== */}
      <div
        className="px-5 py-4 grid grid-cols-[auto_1fr_auto] items-center gap-4"
        style={{ backgroundColor: hexToRgba(palette.pageBg, 0.7) }}
      >
        {/* Left: Select Client */}
        <div className="relative inline-block">
          <label className="sr-only">Select Client</label>
          <select
            className="appearance-none h-10 w-56 md:w-64 pl-3 pr-9 rounded-xl border border-black/30 bg-white font-semibold text-base shadow-sm focus:outline-none"
            value={activeClientId || ''}
            onChange={(e) => onClientChange(e.target.value)}
            aria-label="Select client"
          >
            <option value="">{'- Select a client -'}</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-black/60 text-base">▾</span>
        </div>

        {/* Center: Title (mirrors the calendar page behavior) */}
        <div className="justify-self-center -ml-6 md:-ml-10">
          <h1 className="font-extrabold leading-none text-2xl md:text-3xl">
            {displayName ? `${displayName}’s Schedule` : 'Client Schedule'}
          </h1>
        </div>

        {/* Right: Print */}
        <div className="justify-self-end">
          <button
            onClick={onPrint}
            className="inline-flex items-center px-4 py-2 rounded-xl border border-black/30 bg-white font-semibold text-base hover:bg-black/5"
            aria-label="Print"
            title="Print"
          >
            Print
          </button>
        </div>
      </div>

      {/* ===== Main content: Budget Report ===== */}
      <main className="flex-1 bg-[#F8CBA6]/40 flex items-start justify-center">
        <div className="w-full max-w-6xl m-6 rounded-3xl border-[#3A0000] bg-[#FFF4E6] shadow-md overflow-hidden">
          {/* Card top bar (title + search) */}
          <div className="bg-[#3A0000] px-6 py-4 flex items-center justify-between">
            <h2 className="text-white text-2xl font-semibold">Budget Report</h2>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search"
              className="h-9 rounded-full bg-white text-black px-4 border"
            />
          </div>

          {/* Alert banner */}
          <div className="w-full bg-[#fde7e4] border-y border-[#f5c2c2] px-6 py-3">
            <p className="text-[#9b2c2c] font-semibold">
              WARNING: Dental Checkup budget exceeded by <b>$36</b>
            </p>
          </div>

          {/* Body */}
          <div className="px-6 py-6">
            {/* Year selector */}
            <div className="mb-4 flex items-center gap-2 px-2">
              <span className="font-semibold text-[#000]">Select year:</span>
              <select
                value={year}
                onChange={(e) => setYear(e.target.value)}
                className="rounded-md bg-white text-black text-sm px-3 py-1 border"
              >
                <option value="2025">2025</option>
                <option value="2024">2024</option>
                <option value="2023">2023</option>
              </select>
              <button type="button" aria-label="Help" className="h-6 w-6 rounded-full bg-[#E37E72] text-white text-xs">?</button>
            </div>

            {/* Overview tiles */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 text-black text-center">
              <div className="rounded-2xl border px-6 py-4 bg-[#F8CBA6] flex flex-col items-center justify-center">
                <div className="text-2xl font-bold">
                  ${totals.allocated.toLocaleString()}
                </div>
                <div className="text-sm">Annual Budget</div>
              </div>

              <div className="rounded-2xl border px-6 py-4 bg-white flex flex-col items-center justify-center">
                <div className="text-2xl font-bold">
                  ${totals.spent.toLocaleString()}
                </div>
                <div className="text-sm">Spent to Date</div>
              </div>

              <div className="rounded-2xl border px-6 py-4 bg-white flex flex-col items-center justify-center">
                <div className={`text-2xl font-bold ${totals.remaining < 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {totals.remaining < 0
                    ? `-$${Math.abs(totals.remaining).toLocaleString()}`
                    : `$${totals.remaining.toLocaleString()}`}
                </div>
                <div className="text-sm">Remaining Balance</div>
              </div>
            </div>

            {/* Table */}
            <div className="rounded-2xl border border-[#3A0000] bg-white text-black overflow-hidden">
              <div className="px-4 py-3 bg-[#F4A6A0] flex items-center justify-between">
                <div className="font-semibold">Overspent Items: 1</div>
                <div className="text-sm text-black">Year: {year}</div>
              </div>

              <table className="w-full text-left text-sm">
                <thead className="bg-[#3A0000] text-white">
                  <tr>
                    <th className="px-4 py-3">Categories</th>
                    <th className="px-4 py-3">Allocated Budget</th>
                    <th className="px-4 py-3">Amount Spent</th>
                    <th className="px-4 py-3">Remaining</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r, i) => {
                    const remaining = r.allocated - r.spent;
                    const status = getStatus(remaining);
                    return (
                      <tr key={i} className="border-top border-[#3A0000]/20">
                        <td className="px-4 py-3">
                          <Link
                            href={`/budget_report/category-cost/${r.category.trim().toLowerCase().replace(/\s+/g, '-')}`}
                            className="font-bold text-black underline"
                          >
                            {r.category}
                          </Link>
                        </td>
                        <td className="px-4 py-3">${r.allocated}</td>
                        <td className="px-4 py-3">${r.spent}</td>
                        <td className={`px-4 py-3 ${remaining < 0 ? 'text-red-600' : ''}`}>
                          {remaining < 0 ? `-$${Math.abs(remaining)}` : `$${remaining}`}
                        </td>
                        <td className="px-4 py-3">
                          <Badge tone={status.tone}>{status.label}</Badge>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Actions */}
            <div className="mt-6 flex justify-end gap-3">
              <button className="px-5 rounded-full bg-white text-black border">Export CSV</button>
              <button className="h-10 px-5 rounded-full bg-[#3A0000] text-white" onClick={onPrint}>Print</button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
