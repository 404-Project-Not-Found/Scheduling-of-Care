'use client';

/**
 * File: app/calender_dashboard/category-cost/[category]/page.tsx
 * Frontend Author: Qingyue Zhao
 * 
 * Purpose:
 * - Category Budget Report page for a specific category (e.g., Appointments).
 * - Reuses the same chrome (header + pink banner) via <DashboardChrome /> so
 *   layout/branding are identical to the annual Budget Report page.
 * - Navigates here when a user clicks a category in the annual report.
 *
 * Behavior:
 * - Reads the `[category]` route param and converts slug -> Title case.
 * - Loads mock client list and restores active client selection (same as annual page).
 * - Shows category-level summary tiles and a table of items within this category.
 * - Adds a "< Back" text link (top-left in brown header) to return to
 *   /calender_dashboard/budget_report.
 * - Management-only: Edit flow to override this category's budget number
 *   (Edit → Save/Cancel), and recompute Remaining accordingly.
 */

import React, { Suspense, useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';

import DashboardChrome from '@/components/top_menu/client_schedule';
import Badge from '@/components/ui/Badge';

import {
  getViewerRoleFE,
  getClientsFE,
  readActiveClientFromStorage,
  writeActiveClientToStorage,
  type Client as ApiClient,
} from '@/lib/mockApi';

// ---------------- Demo data ----------------
type Row = { item: string; category: string; allocated: number; spent: number };
const allRows: Row[] = [
  { item: 'Dental Appointments', category: 'Appointments', allocated: 600, spent: 636 },
  { item: 'Toothbrush Heads',    category: 'Hygiene',      allocated: 30,  spent: 28  },
  { item: 'Socks',               category: 'Clothing',     allocated: 176, spent: 36  },
];

// ---------------- Helpers ----------------
const unslug = (s: string) =>
  s.split('-').map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join(' ');

type Tone = 'green' | 'yellow' | 'red';
const getStatus = (remaining: number): { tone: Tone; label: string } => {
  if (remaining < 0) return { tone: 'red', label: 'Exceeded' };
  if (remaining <= 5) return { tone: 'yellow', label: 'Nearly Exceeded' };
  return { tone: 'green', label: 'Within Limit' };
};

// Palette used by the annual page
const colors = {
  header: '#3A0000',
  banner: '#F9C9B1', // DashboardChrome applies transparency internally
  text:   '#2b2b2b',
};

// Annual report route (Back target)
const BACK_TARGET = '/calender_dashboard/budget_report';

type Client = { id: string; name: string };
type Role = 'carer' | 'family' | 'management';

export default function CategoryCostPage() {
  return (
    <Suspense fallback={<div className="p-6 text-gray-600">Loading category...</div>}>
      <CategoryCostInner />
    </Suspense>
  );
}

function CategoryCostInner() {
  const router = useRouter();
  const role: Role = getViewerRoleFE();
  const isManagement = role === 'management';

  // ----- Route param -> human-readable category name -----
  const params = useParams<{ category: string }>();
  const categorySlug = params.category;
  const categoryName = unslug(categorySlug);
  const year = '2025';

  // ----- Clients (same behavior as annual page) -----
  const [clients, setClients] = useState<Client[]>([]);
  const [activeClientId, setActiveClientId] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState<string>('');

  useEffect(() => {
    (async () => {
      try {
        const list = await getClientsFE(); // ApiClient[]
        const mapped: Client[] = list.map((c: ApiClient) => ({ id: c._id, name: c.name }));
        setClients(mapped);

        // Restore last active client selection
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

  // ----- Top-right avatar dropdown (same as annual page) -----
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
            href="/"
            className="block w-full text-left px-5 py-4 text-xl font-semibold hover:bg-black/5"
            onClick={() => setOpenProfileMenu(false)}
          >
            Sign out
          </Link>
        </div>
      )}
    </>
  );

  // ----- Logo click (same as annual page) -----
  const onLogoClick = () => {
    if (typeof window !== 'undefined') localStorage.setItem('activeRole', role);
    router.push('/empty_dashboard');
  };

  // ----- Filter rows for this category -----
  const rows = useMemo(
    () => allRows.filter((r) => r.category.toLowerCase() === categoryName.toLowerCase()),
    [categoryName]
  );

  // Base totals from data
  const baseTotals = useMemo(() => {
    const allocated = rows.reduce((s, r) => s + r.allocated, 0);
    const spent = rows.reduce((s, r) => s + r.spent, 0);
    return { allocated, spent, remaining: allocated - spent };
  }, [rows]);

  // ===== Management-only editing state for THIS CATEGORY budget =====
  const [isEditing, setIsEditing] = useState(false);
  const [categoryBudgetOverride, setCategoryBudgetOverride] = useState<number | null>(null);
  const [categoryBudgetInput, setCategoryBudgetInput] = useState<string>('');

  // Apply override if present
  const effectiveAllocated = categoryBudgetOverride ?? baseTotals.allocated;
  const effectiveRemaining = effectiveAllocated - baseTotals.spent;

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
      {/* Main content area: mirrors annual page spacing/background */}
      <div className="flex-1 h-full bg-[#F8CBA6]/40 overflow-auto">
        <div className="w-full h-full p-6">
          <div className="w-full rounded-3xl border-[#3A0000] bg-[#FFF4E6] shadow-md flex flex-col overflow-hidden">
            {/* Panel header: "< Back" on the left; optional controls on the right */}
            <div className="bg-[#3A0000] px-6 py-4 flex items-center justify-between">
              {/* Left: Back + Title (same line) */}
              <div className="flex items-center gap-8">
                <Link
                  href={BACK_TARGET}
                  className="text-white/90 hover:text-white font-bold"
                  aria-label="Back to annual Budget Report"
                  title="Back to Budget Report"
                >
                  &lt; Back
                </Link>
                <h1 className="text-white text-2xl font-semibold">
                  {categoryName} Budget Report
                </h1>
              </div>

              {/* Right: management-only Edit/Save/Cancel (same UX as annual page) */}
              <div className="flex items-center gap-3">
                {isManagement && (
                  !isEditing ? (
                    <button
                      onClick={() => {
                        setIsEditing(true);
                        setCategoryBudgetInput(String(categoryBudgetOverride ?? baseTotals.allocated));
                      }}
                      className="px-3 py-1 rounded-md bg-white text-black font-semibold hover:bg-black/10"
                      aria-label="Edit category budget"
                      title="Edit category budget"
                    >
                      Edit
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={() => {
                          const val = parseFloat(categoryBudgetInput);
                          if (!Number.isFinite(val) || val < 0) return;
                          setCategoryBudgetOverride(val);
                          setIsEditing(false);
                        }}
                        className="px-3 py-1 rounded-md bg-white text-black font-semibold hover:bg-black/10"
                        aria-label="Save category budget"
                        title="Save category budget"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => {
                          setIsEditing(false);
                          setCategoryBudgetInput('');
                        }}
                        className="px-3 py-1 rounded-md bg-white/80 text-black font-semibold hover:bg-white"
                        aria-label="Cancel editing"
                        title="Cancel"
                      >
                        Cancel
                      </button>
                    </>
                  )
                )}
              </div>
            </div>

            {/* Body */}
            <div className="px-6 py-6">
              {/* Overview tiles */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 text-center text-black">
                {/* Category Budget (editable for management only) */}
                <div className="rounded-2xl border px-6 py-6 bg-[#F8CBA6]">
                  {isManagement && isEditing ? (
                    <>
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={categoryBudgetInput}
                        onChange={(e) => setCategoryBudgetInput(e.target.value)}
                        className="w-full max-w-[220px] mx-auto text-center text-2xl font-bold rounded-md bg-white text-black px-3 py-2 border"
                        aria-label="Category budget amount"
                      />
                      <div className="text-sm mt-2">{categoryName} Budget</div>
                    </>
                  ) : (
                    <>
                      <div className="text-2xl font-bold">
                        ${effectiveAllocated.toLocaleString()}
                      </div>
                      <div className="text-sm">{categoryName} Budget</div>
                    </>
                  )}
                </div>

                {/* Spent to Date */}
                <div className="rounded-2xl border px-6 py-6 bg-white">
                  <div className="text-2xl font-bold">${baseTotals.spent.toLocaleString()}</div>
                  <div className="text-sm">Spent to Date</div>
                </div>

                {/* Remaining (recomputed if edited) */}
                <div className="rounded-2xl border px-6 py-6 bg-white">
                  <div className={`text-2xl font-bold ${effectiveRemaining < 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {effectiveRemaining < 0
                      ? `-$${Math.abs(effectiveRemaining).toLocaleString()}`
                      : `$${effectiveRemaining.toLocaleString()}`}
                  </div>
                  <div className="text-sm">Remaining Balance</div>
                </div>
              </div>

              {/* Table */}
              <div className="rounded-2xl border border-[#3A0000] bg-white overflow-hidden">
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
