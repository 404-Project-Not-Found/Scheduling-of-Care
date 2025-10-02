'use client';

/**
 * Budget Report (reusing DashboardChrome)
 * - Underlines "Budget Report" in the top menu via page="budget".
 * - Pink banner title becomes "<Client>'s Budget" automatically.
 * - Body fills the remaining viewport height (same as calendar page).
 */

import React, { Suspense, useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import DashboardChrome from '@/components/top_menu/client_schedule';
import Badge from '@/components/ui/Badge';

import {
  getViewerRoleFE,
  getClientsFE,
  readActiveClientFromStorage,
  writeActiveClientToStorage,
  type Client as ApiClient,
} from '@/lib/mockApi';

// ------- Demo rows; replace with real data when integrating -------
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

// ------- Shared palette passed to chrome -------
const colors = {
  header: '#3A0000',
  banner: '#F9C9B1', // chrome内部会做透明度处理
  text:   '#2b2b2b',
};

type Client = { id: string; name: string };
type Role = 'carer' | 'family' | 'management';

export default function BudgetReportPage() {
  return (
    <Suspense fallback={<div className="p-6 text-gray-600">Loading budget report...</div>}>
      <BudgetReportInner />
    </Suspense>
  );
}

function BudgetReportInner() {
  const router = useRouter();

  // ===== Role (from mockApi) =====
  const role: Role = getViewerRoleFE();

  // ===== Clients (from mockApi) =====
  const [clients, setClients] = useState<Client[]>([]);
  const [activeClientId, setActiveClientId] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState<string>('');

  useEffect(() => {
    (async () => {
      try {
        const list = await getClientsFE(); // ApiClient[]
        const mapped: Client[] = list.map((c: ApiClient) => ({ id: c._id, name: c.name }));
        setClients(mapped);

        // Restore persisted selection
        const { id, name } = readActiveClientFromStorage();
        if (id) {
          setActiveClientId(id);
          setDisplayName(name || mapped.find(m => m.id === id)?.name || '');
        }
      } catch {
        setClients([]);
      }
    })();
  }, []);

  const onClientChange = (id: string) => {
    if (!id) {
      setActiveClientId(null);
      setDisplayName('');
      writeActiveClientToStorage('', '');
      return;
    }
    const c = clients.find((x) => x.id === id);
    const name = c?.name || '';
    setActiveClientId(id);
    setDisplayName(name);
    writeActiveClientToStorage(id, name);
  };

  // ===== Avatar dropdown (slot to chrome) =====
  const [openProfileMenu, setOpenProfileMenu] = useState(false);
  const topRight = (
    <>
      <button
        onClick={() => setOpenProfileMenu(v => !v)}
        aria-haspopup="menu"
        aria-expanded={openProfileMenu}
        className="h-16 w-16 rounded-full overflow-hidden border-2 border-white/80 hover:border-white"
        title="Account"
      >
        <Image src="/default_profile.png" alt="Profile" width={64} height={64} className="h-full w-full object-cover" />
      </button>
      {openProfileMenu && (
        <div className="absolute right-0 mt-3 w-80 rounded-md border border-white/30 bg-white text-black shadow-2xl z-50">
          <Link
            href="/management/profile"
            className="block w-full text-left px-5 py-4 text-xl font-semibold hover:bg-black/5"
            onClick={() => setOpenProfileMenu(false)}
          >
            Update your details
          </Link>
          <Link
            href="/api/auth/signout"
            className="block w-full text-left px-5 py-4 text-xl font-semibold hover:bg-black/5"
            onClick={() => setOpenProfileMenu(false)}
          >
            Sign out
          </Link>
        </div>
      )}
    </>
  );

  // ===== Logo -> home (same behavior as calendar) =====
  const onLogoClick = () => {
    if (typeof window !== 'undefined') localStorage.setItem('activeRole', role);
    router.push('/empty_dashboard');
  };

  // ===== Local UI state =====
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
    <DashboardChrome
      page="budget"
      clients={clients}
      activeClientId={activeClientId}
      onClientChange={onClientChange}
      activeClientName={displayName}
      colors={colors}
      topRight={topRight}
      onLogoClick={onLogoClick}
    >
      {/* ===== Main content fills the remaining viewport (same sizing as calendar page) ===== */}
      <div className="flex-1 h-full bg-[#F8CBA6]/40 overflow-auto">
        <div className="w-full h-full p-6">
          <div className="w-full h-[600px] rounded-3xl border-[#3A0000] bg-[#FFF4E6] shadow-md flex flex-col overflow-hidden">
            {/* Card top bar */}
            <div className="bg-[#3A0000] px-6 py-4 flex items-center justify-between">
              <h2 className="text-white text-2xl font-semibold">Budget Report</h2>
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search"
                className="h-9 rounded-full bg-white text-black px-4 border"
              />
            </div>

            {/* Alert banner (example) */}
            <div className="w-full bg-[#fde7e4] border-y border-[#f5c2c2] px-6 py-3">
              <p className="text-[#9b2c2c] font-semibold">
                WARNING: Dental Checkup budget exceeded by <b>$36</b>
              </p>
            </div>

            {/* Body */}
            <div className="flex-1 px-6 py-6 overflow-auto">
              {/* Year selector */}
              <div className="mb-4 flex items-center gap-2">
                <span className="font-semibold">Select year:</span>
                <select
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  className="rounded-md bg-white text-black text-sm px-3 py-1 border"
                >
                  <option value="2025">2025</option>
                  <option value="2024">2024</option>
                  <option value="2023">2023</option>
                </select>
              </div>

              {/* Overview tiles */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 text-center">
                <div className="rounded-2xl border px-6 py-6 bg-[#F8CBA6]">
                  <div className="text-2xl font-bold">${totals.allocated.toLocaleString()}</div>
                  <div className="text-sm">Annual Budget</div>
                </div>
                <div className="rounded-2xl border px-6 py-6 bg-white">
                  <div className="text-2xl font-bold">${totals.spent.toLocaleString()}</div>
                  <div className="text-sm">Spent to Date</div>
                </div>
                <div className="rounded-2xl border px-6 py-6 bg-white">
                  <div className={`text-2xl font-bold ${totals.remaining < 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {totals.remaining < 0
                      ? `-$${Math.abs(totals.remaining).toLocaleString()}`
                      : `$${totals.remaining.toLocaleString()}`}
                  </div>
                  <div className="text-sm">Remaining Balance</div>
                </div>
              </div>

              {/* Table */}
              <div className="rounded-2xl border border-[#3A0000] bg-white overflow-hidden">
                <table className="w-full text-left text-sm">
                  <thead className="bg-[#3A0000] text-white">
                    <tr>
                      <th className="px-4 py-4">Category</th>
                      <th className="px-4 py-4">Allocated</th>
                      <th className="px-4 py-4">Spent</th>
                      <th className="px-4 py-4">Remaining</th>
                      <th className="px-4 py-4">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((r, i) => {
                      const remaining = r.allocated - r.spent;
                      const status = getStatus(remaining);
                      return (
                        <tr key={i} className="border-t border-[#3A0000]/20">
                          <td className="px-4 py-5">
                            <Link
                              href={`/calender_dashboard/budget_report/category-cost/${encodeURIComponent(
                                r.category.trim().toLowerCase().replace(/\s+/g, '-')
                              )}`}
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
            </div>
          </div>
        </div>
      </div>
    </DashboardChrome>
  );
}
