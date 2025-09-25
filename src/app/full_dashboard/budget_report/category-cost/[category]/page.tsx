'use client';

import { useMemo } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Badge from '@/components/ui/Badge';

type Row = { item: string; category: string; allocated: number; spent: number };
const allRows: Row[] = [
  {
    item: 'Dental Appointments',
    category: 'Appointments',
    allocated: 600,
    spent: 636,
  },
  { item: 'Toothbrush Heads', category: 'Hygiene', allocated: 30, spent: 28 },
  { item: 'Socks', category: 'Clothing', allocated: 176, spent: 36 },
];

const unslug = (s: string) =>
  s
    .split('-')
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join(' ');

type Tone = 'green' | 'yellow' | 'red';
const getStatus = (remaining: number): { tone: Tone; label: string } => {
  if (remaining < 0) return { tone: 'red', label: 'Exceeded' };
  if (remaining <= 5) return { tone: 'yellow', label: 'Nearly Exceeded' };
  return { tone: 'green', label: 'Within Limit' };
};

export default function CategoryCostPage() {
  const params = useParams<{ category: string }>();
  const categorySlug = params.category;
  const categoryName = unslug(categorySlug);
  const year = '2025';

  const rows = useMemo(
    () =>
      allRows.filter(
        (r) => r.category.toLowerCase() === categoryName.toLowerCase()
      ),
    [categoryName]
  );

  const totals = useMemo(() => {
    const allocated = rows.reduce((s, r) => s + r.allocated, 0);
    const spent = rows.reduce((s, r) => s + r.spent, 0);
    return { allocated, spent, remaining: allocated - spent };
  }, [rows]);

  return (
    <main className="min-h-screen flex items-center justify-center bg-[#F8CBA6]">
      <div className="w-full max-w-6xl m-6 rounded-3xl border-4 border-[#3A0000] bg-[#FFF4E6] shadow-md overflow-hidden">
        {/* Top bar */}
        <div className="bg-[#3A0000] px-6 py-4 flex items-center justify-between">
          <h1 className="text-white text-2xl font-semibold">
            {categoryName} Budget Report
          </h1>

          <Link
            href="/total-cost"
            className="rounded-full px-5 py-2 text-black text-sm font-semibold
                       bg-[#FFA94D] hover:bg-[#FF9800] active:bg-[#FF8A00]
                       shadow-md focus:outline-none focus:ring-2 focus:ring-white/70"
            aria-label="Back to total cost"
            title="Back to total report"
          >
            Back
          </Link>
        </div>

        {/* Body */}
        <div className="px-6 py-6">
          {/* Overview tiles */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 text-black text-center">
            <div className="rounded-2xl border px-6 py-4 bg-[#F8CBA6] flex flex-col items-center justify-center">
              <div className="text-2xl font-bold">
                ${totals.allocated.toLocaleString()}
              </div>
              <div className="text-sm">{categoryName} Budget</div>
            </div>

            <div className="rounded-2xl border px-6 py-4 bg-white flex flex-col items-center justify-center">
              <div className="text-2xl font-bold">
                ${totals.spent.toLocaleString()}
              </div>
              <div className="text-sm">Spent to Date</div>
            </div>

            <div className="rounded-2xl border px-6 py-4 bg-white flex flex-col items-center justify-center">
              <div
                className={`text-2xl font-bold ${
                  totals.remaining < 0 ? 'text-red-600' : 'text-green-600'
                }`}
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
              <div className="font-semibold">Items in {categoryName}</div>
              <div className="text-sm text-black">Year: {year}</div>
            </div>

            <table className="w-full text-left text-sm">
              <thead className="bg-[#3A0000] text-white">
                <tr>
                  <th className="px-4 py-3">Item</th>
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
                    <tr key={i} className="border-t border-[#3A0000]/20">
                      <td className="px-4 py-3">{r.item}</td>
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
        </div>
      </div>
    </main>
  );
}
