'use client';

import React, { Suspense, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import Badge from '@/components/Badge';

type Row = { item: string; category: string; allocated: number; spent: number };
const rows: Row[] = [
  {
    item: 'Dental Appointments',
    category: 'Appointments',
    allocated: 600,
    spent: 636,
  },
  { item: 'Toothbrush Heads', category: 'Hygiene', allocated: 30, spent: 28 },
  { item: 'Socks', category: 'Clothing', allocated: 176, spent: 36 },
];

const slugify = (s: string) => s.trim().toLowerCase().replace(/\s+/g, '-');

type Tone = 'green' | 'yellow' | 'red';
const getStatus = (remaining: number): { tone: Tone; label: string } => {
  if (remaining < 0) return { tone: 'red', label: 'Exceeded' };
  if (remaining <= 5) return { tone: 'yellow', label: 'Nearly Exceeded' };
  return { tone: 'green', label: 'Within Limit' };
};

// -------- Role helpers (frontend-only; does NOT touch backend) --------
type Role = 'carer' | 'family' | 'management';

function getActiveRole(): Role {
  if (typeof window === 'undefined') return 'carer';
  const r =
    (localStorage.getItem('activeRole') as Role | null) ||
    (sessionStorage.getItem('mockRole') as Role | null) ||
    'carer';
  return (['carer', 'family', 'management'] as const).includes(r as Role)
    ? (r as Role)
    : 'carer';
}

/** Decide where FAMILY should go back to.
 * Priority:
 *   1) URL ?from=full_dashboard|partial_dashboard (optional)
 *   2) localStorage.lastDashboard: 'full' -> /full_dashboard?viewer=family, else /partial_dashboard
 *   3) default: /partial_dashboard
 */
function resolveFamilyBackPath(searchParams: {
  get: (k: string) => string | null;
}): string {
  const from = searchParams.get('from');
  if (from === 'full_dashboard') return '/full_dashboard?viewer=family';
  if (from === 'partial_dashboard') return '/partial_dashboard';

  if (typeof window !== 'undefined') {
    const last = localStorage.getItem('lastDashboard'); // 'full' | 'partial'
    if (last === 'full') return '/full_dashboard?viewer=family';
    if (last === 'partial') return '/partial_dashboard';
  }
  return '/partial_dashboard';
}

// ---------- Suspense wrapper page ----------
export default function TotalCostPage() {
  return (
    <Suspense
      fallback={
        <div className="p-6 text-gray-600">Loading budget report...</div>
      }
    >
      <TotalCostInner />
    </Suspense>
  );
}

function TotalCostInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [q, setQ] = useState('');
  const [year, setYear] = useState('2025');

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return rows;
    return rows.filter(
      (r) =>
        r.item.toLowerCase().includes(t) || r.category.toLowerCase().includes(t)
    );
  }, [q]);

  const totals = useMemo(() => {
    const allocated = filtered.reduce((s, r) => s + r.allocated, 0);
    const spent = filtered.reduce((s, r) => s + r.spent, 0);
    return { allocated, spent, remaining: allocated - spent };
  }, [filtered]);

  // Back button handler (role-aware)
  const handleBack = () => {
    const role = getActiveRole();
    if (role === 'family') {
      router.push(resolveFamilyBackPath(searchParams));
    } else if (role === 'management') {
      router.push('/menu/management');
    } else {
      router.push('/carer_dashboard');
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-[#F8CBA6] relative">
      <div className="w-full max-w-6xl m-6 rounded-3xl border-4 border-[#3A0000] bg-[#FFF4E6] shadow-md overflow-hidden">
        {/* Top bar */}
        <div className="bg-[#3A0000] px-6 py-4 flex items-center justify-between">
          <h1 className="text-white text-2xl font-semibold">Budget Report</h1>
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
            <button
              type="button"
              aria-label="Help"
              className="h-6 w-6 rounded-full bg-[#E37E72] text-white text-xs"
            >
              ?
            </button>
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
              <div
                className={`text-2xl font-bold ${totals.remaining < 0 ? 'text-red-600' : 'text-green-600'}`}
              >
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
                {filtered.map((r, i) => {
                  const remaining = r.allocated - r.spent;
                  const status = getStatus(remaining);
                  return (
                    <tr key={i} className="border-t border-[#3A0000]/20">
                      <td className="px-4 py-3">
                        <Link
                          href={`/category-cost/${slugify(r.category)}`}
                          className="font-bold text-black underline"
                        >
                          {r.category}
                        </Link>
                      </td>
                      <td className="px-4 py-3">${r.allocated}</td>
                      <td className="px-4 py-3">${r.spent}</td>
                      <td
                        className={`px-4 py-3 ${remaining < 0 ? 'text-red-600' : ''}`}
                      >
                        {remaining < 0
                          ? `-$${Math.abs(remaining)}`
                          : `$${remaining}`}
                      </td>
                      <td>
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
            <button className="px-5 rounded-full bg-white text-black border">
              Export CSV
            </button>
            <button className="h-10 px-5 rounded-full bg-[#3A0000] text-white">
              Print
            </button>
          </div>
        </div>
      </div>

      {/* Back to Dashboard Button (role-aware) */}
      <button
        onClick={handleBack}
        className="fixed bottom-6 left-6 px-5 py-2 rounded-lg bg-orange-400 text-black font-semibold shadow-md hover:bg-orange-500"
      >
        ← Back to Dashboard
      </button>
    </main>
  );
}
