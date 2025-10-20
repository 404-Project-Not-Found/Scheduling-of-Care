/**
 * File path: app/calendar_dashboard/category-cost/[category]/page.tsx
 * Frontend Author: Qingyue Zhao
 *
 * Purpose:
 * - Category Budget Report page for a specific category (e.g., Appointments).
 * - Uses the SAME full-bleed layout & chrome as the annual Budget Report page.
 * - Reached by clicking a category link on the annual report.
 * - Fetches rows via getBudgetRowsFE(activeClientId).
 *
 * Updated by Zahra Rizqita (18/10/2025): Backend implemented -- mockApi no longer functional
 * - Remove dropdown for clients
 */

'use client';

import React, { Suspense, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';

import DashboardChrome from '@/components/top_menu/client_schedule';
import Badge from '@/components/ui/Badge';

import {
  getViewerRole,
  getActiveClient,
  setActiveClient,
  type Client as ApiClient,
} from '@/lib/data';

import { 
  getCategoryDetail, 
  setCategoryAllocation, 
  setItemAllocation, 
  openBudgetSSE, 
  type CategoryDetail, 
  getBudgetSummary, 
  type BudgetSummary,
  getAvailableYears,
} from '@/lib/budget-helpers';

/* ------------------------------- Utils ------------------------------- */

const LOW_BUDGET_THRESHOLD = 0.15;
type Tone = 'green' | 'yellow' | 'red';
const getStatus = (remaining: number, allocated: number): { tone: Tone; label: string } => {
  if(allocated === 0) return {tone: 'green', label: 'Not allocated'};
  if (remaining <= 0) return { tone: 'red', label: 'Used up' };
  const ratio = remaining/(allocated || 1);
  if (ratio <= LOW_BUDGET_THRESHOLD) return { tone: 'yellow', label: 'Nearly used up' };
  return { tone: 'green', label: 'Within Limit' };
};

const capitalise = (s: string) => (s ? s[0].toUpperCase() + s.slice(1): '');
/* ------------------------------- Chrome colors ------------------------------- */
const colors = {
  header: '#3A0000',
  banner: '#F9C9B1',
  text: '#2b2b2b',
};

/* ---------------------------------- Types ---------------------------------- */
type Client = { id: string; name: string };
type Role = 'carer' | 'family' | 'management';

type ClientLite = {
  id: string;
  name: string;
  orgAccess?: 'approved' | 'pending' | 'revoked';
};

type ApiClientWithAccess = ApiClient & {
  orgAccess?: 'approved' | 'pending' | 'revoked';
};

export default function CategoryCostPage() {
  return (
    <Suspense
      fallback={<div className="p-6 text-gray-600">Loading category...</div>}
    >
      <CategoryCostInner />
    </Suspense>
  );
}


function CategoryCostInner() {
  const router = useRouter();
  const { categoryId } = useParams<{ categoryId: string }>();

  /* ===== Role ===== */
  const [role, setRole] = useState<Role>('family');
  useEffect(() => {
    (async () => {
      const r = await getViewerRole();
      setRole(r);
    })();
  }, []);
  const isManagement = role === 'management';

  /* ===== Clients ===== */
  const [clients, setClients] = useState<Client[]>([]);
  const [activeClientId, setActiveClientId] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState<string>('');

  /** Load clients */
  useEffect(() => {
      (async () => {
        const active = await getActiveClient();
        if(!active?.id) {
          router.push('/calendar_dashboard/budget_report');
          return;
        }
        setActiveClientId(active.id);
        setDisplayName(active.name || '')
      })();
    }, [router]);
    
  const onLogoClick = () => {
    router.push('/icon_dashboard');
  };

  /* ===== Dynamic Date ===== */
  const [q, setQ] = useState('');
  const [years, setYears] = useState<number[]>([2025]);
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [todayDate, setTodaysDate] = useState<string>();
  
  // get current date
  useEffect(() => {
    const d = new Date();
    const fmt = new Intl.DateTimeFormat('en-AU', {dateStyle: 'long', timeZone:'Australia/Melbourne'});
    setTodaysDate(fmt.format(d));
  }, [activeClientId]);
  
  // get years available in database
  useEffect(() => {
    let abort = new AbortController();
    const load = async () => {
      if(!activeClientId) {
        setYears([]);
        return;
      }
      try {
        const list = await getAvailableYears(activeClientId, abort.signal);
        if(list.length > 0) {
          setYears(list);
          if(!list.includes(year)) setYear(list[0]);
        }
        else {
          const curr = new Date().getFullYear();
          setYears([curr]);
         setYear(curr);
        }
      } catch(e) {
        console.error('Failed to load years:', e);
        const curr = new Date().getFullYear();
        setYears([curr]);
      setYear(curr);
      }
    };
    load();
    return () => abort.abort();
  }, [activeClientId]);
  
  /* ===== Budget ===== */
  const [detail, setDetail] = useState<CategoryDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState<BudgetSummary>({annualAllocated: 0, spent: 0, remaining: 0, surplus: 0})

  const reload = async () => {
    if (!activeClientId) { setDetail(null); return; }
    setLoading(true);
    try {
      const [d, s] = await Promise.all([
        getCategoryDetail(activeClientId, categoryId, year),
        getBudgetSummary(activeClientId, year),
      ]);
      setDetail(d);
      setSummary(s);
      setCategoryAmountInput(String(d.allocated ?? 0));
      const next: Record<string, string> = {};
      d.items.forEach((it) => { next[it.careItemSlug] = String(it.allocated ?? 0); });
      setItemEdits(next);
    } catch (e) {
      console.error(e);
      setDetail(null);
      setSummary({ annualAllocated: 0, spent: 0, remaining: 0, surplus: 0 });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void reload(); }, [activeClientId, year, categoryId]);

  /** Live update by SSE */
  useEffect(() => {
    if(!activeClientId) return;
    const stop = openBudgetSSE(activeClientId, year, () => {void reload()});
    return () => stop();
    //eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeClientId, year, categoryId]);

  // load edit input
  const [categoryAmountInput, setCategoryAmountInput] = useState<string>('');

  const isPastYear = year < new Date().getFullYear();

  /** Editing state for category */
  const [isEditingCategory, setIsEditingCategory] = useState(false);


  const startEditCategory = () => {
    if(!detail) return;
    setCategoryAmountInput(String(detail.allocated ?? 0));
    setIsEditingCategory(true);
  };

  const cancelEditCategory = () => {
    if (!detail) return;
    setCategoryAmountInput(String(detail.allocated ?? 0));
    setIsEditingCategory(false);
  };


  const saveCategory = async () => {
    if(!activeClientId || !detail) return;
    const amount = Number(categoryAmountInput);
    if(!Number.isFinite(amount) || amount < 0) return;
    try {
      await setCategoryAllocation(activeClientId, year, categoryId, amount, detail.categoryName);
      await reload();
    } catch(e) {
      console.error('setCategory failed', e);
    }
  };
  /** Editing state for care item */
  const [editingItemSlug, setEditingItemSlug] = useState<string | null>(null);
  const [itemEdits, setItemEdits] = useState<Record<string, string>>({});
  const [itemAllocInput, setItemAllocInput] = useState<Record<string, string>>({});

  const startEditItem = (slug: string, currentAllocated: number) => { 
    setItemAllocInput((p) => ({ ...p, [slug]: String(currentAllocated) })); 
    setEditingItemSlug(slug); 
  }; 
  
  const cancelEditItem = () => { setEditingItemSlug(null); };

  const saveItem = async (slug: string) => {
    if (!activeClientId) return;
    const amount = Number(itemAllocInput[slug] ?? '0');
    if (!Number.isFinite(amount) || amount < 0) return;
    try {
      await setItemAllocation(activeClientId, year, categoryId, slug, amount);
      await reload();
    } catch (e) {
      console.error('setItem failed', e);
    }
  };

  const remaining = useMemo(() => {
    if (!detail) return 0;
    return (detail.allocated ?? 0) - (detail.spent ?? 0);
  }, [detail]);

  const filterItems = useMemo(() => {
    const t = q.trim().toLowerCase();
    const items = detail?.items ?? [];
    if (!t) return items;
    return items.filter((it) =>
      `${it.label} ${it.careItemSlug}`.toLowerCase().includes(t)
    );
  }, [detail, q]);

  const firstExceeded = useMemo(
    () => filterItems.find((it) => it.spent > it.allocated),
    [filterItems]
  );

  const lowItems = useMemo(() => {
    return filterItems
      .filter((it) => it.allocated > 0)
      .map((it) => ({
        ...it,
        remaining: it.allocated - it.spent,
        ratio: (it.allocated - it.spent) / it.allocated,
      }))
      .filter((x) => x.remaining > 0 && x.ratio <= LOW_BUDGET_THRESHOLD)
      .sort((a, b) => a.ratio - b.ratio);
  }, [filterItems]);

  const niceCategoryName = useMemo(
    () => capitalise(detail?.categoryName ?? 'Category'),
    [detail?.categoryName]
  );
  return (
    <DashboardChrome
      page="budget"
      clients={[]}
      onClientChange={() => {}}
      colors={colors}
      onLogoClick={onLogoClick}
      showClientPicker={false}
    >
      <div className="flex-1 h-[680px] bg-white/50 overflow-auto">
        {/* Top bar */}
        <div className="w-full bg-[#3A0000] px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link
              href="/calendar_dashboard/budget_report"
              className="text-white/90 hover:text-white font-semibold"
            >
              &lt; Back
            </Link>
            <h2 className="text-white text-2xl font-semibold">{niceCategoryName} Budget</h2>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-white text-lg">Select year:</span>
              <select
                value={String(year)}
                onChange={(e) => setYear(Number(e.target.value))}
                className="rounded-md bg-white text-sm px-3 py-1 border"
              >
                {years.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
              {year === new Date().getFullYear() && todayDate && (
                <span className="font-semibold text-white text-lg ml-2">As of: {todayDate}</span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search items"
              className="h-9 rounded-full bg-white text-black px-4 border"
            />
          </div>
        </div>

        {/* Banners */}
        {detail && remaining < 0 && (
          <div className="w-full bg-[#fde7e4] border-y border-[#f5c2c2] px-6 py-3">
            <p className="text-[#9b2c2c] font-semibold">
              WARNING: Category exceeded by <b>${Math.abs(remaining).toLocaleString()}</b>
            </p>
          </div>
        )}
        {lowItems.length > 0 && (
          <div className="w-full bg-yellow-100 border-y border-yellow-300 px-6 py-3">
            <p className="text-yellow-800 font-semibold mb-1">⚠️ Items nearing their budget limit:</p>
            <ul className="list-disc list-inside text-yellow-800">
              {lowItems.map((it) => (
                <li key={it.careItemSlug}>
                  <span className="font-medium">{it.label}</span> — remaining $
                  {(it.allocated - it.spent).toFixed(2)} ({(it.ratio * 100).toFixed(1)}%)
                </li>
              ))}
            </ul>
          </div>
        )}
        {isPastYear && (
          <div className="w-full bg-yellow-100 border-y border-yellow-300 px-6 py-3 text-yellow-900">
            The selected year ({year}) is read-only. Switch to {new Date().getFullYear()} to edit.
          </div>
        )}

        {/* Content */}
        <div className="w-full px-12 py-10">
          {/* Tiles */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-18 mb-10 text-center">
            <div className="rounded-2xl border px-6 py-8 bg-[#F8CBA6]">
              {isManagement && !isPastYear ? (
                <>
                  {!isEditingCategory ? (
                    <>
                      <div className="text-2xl font-bold">
                        ${(detail?.allocated ?? 0).toLocaleString()}
                      </div>
                      <div className="text-sm">{niceCategoryName} Budget</div>
                      <div className="mt-3">
                        <button
                          onClick={startEditCategory}
                          className="px-3 py-1 rounded-md bg-white text-black font-semibold hover:bg-black/10"
                        >
                          Edit
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <input
                        type="number"
                        min={0}
                        step={1}
                        value={categoryAmountInput}
                        onChange={(e) => setCategoryAmountInput(e.target.value)}
                        className="w-full max-w-[220px] mx-auto text-center text-2xl font-bold rounded-md bg-white text-black px-3 py-2 border"
                        disabled={!detail || loading}
                      />
                      <div className="text-sm mt-2">{niceCategoryName} Budget</div>
                      <div className="mt-3 flex gap-2 justify-center">
                        <button
                          onClick={saveCategory}
                          className="px-3 py-1 rounded-md bg-white text-black font-semibold hover:bg-black/10"
                          disabled={loading}
                        >
                          Save
                        </button>
                        <button
                          onClick={cancelEditCategory}
                          className="px-3 py-1 rounded-md bg-white/80 text-black font-semibold hover:bg-white"
                          disabled={loading}
                        >
                          Cancel
                        </button>
                      </div>
                    </>
                  )}
                </>
              ) : (
                <>
                  <div className="text-2xl font-bold">
                    ${(detail?.allocated ?? 0).toLocaleString()}
                  </div>
                  <div className="text-sm">{niceCategoryName} Budget</div>
                </>
              )}
            </div>

            <div className="rounded-2xl border px-6 py-8 bg-white">
              <div className="text-2xl font-bold">${(detail?.spent ?? 0).toLocaleString()}</div>
              <div className="text-sm">Spent to Date</div>
            </div>

            <div className="rounded-2xl border px-6 py-8 bg-white">
              <div className={`text-2xl font-bold ${remaining < 0 ? 'text-red-600' : 'text-green-600'}`}>
                {remaining < 0
                  ? `-$${Math.abs(remaining).toLocaleString()}`
                  : `$${remaining.toLocaleString()}`}
              </div>
              <div className="text-sm">Remaining Balance</div>
            </div>

            <div className="rounded-2xl border px-6 py-8 bg-white">
              <div className="text-2xl font-bold">${summary.surplus.toLocaleString()}</div>
              <div className="text-sm">Yearly Surplus</div>
            </div>
          </div>

          <div className="rounded-2xl border border-[#3A0000] bg-white overflow-hidden">
            <table className="w-full text-left text-sm bg-white">
              <thead className="bg-[#3A0000] text-lg text-white">
                <tr>
                  <th className="px-4 py-4">Care Item</th>
                  <th className="px-4 py-4">Allocated</th>
                  <th className="px-4 py-4">Spent</th>
                  <th className="px-4 py-4">Remaining</th>
                  <th className="px-4 py-4">Status</th>
                  <th className="px-4 py-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {(detail?.items ?? []).map((it) => {
                  const rem = it.allocated - it.spent;
                  const status = getStatus(rem, it.allocated);

                  const isRowEditing = editingItemSlug === it.careItemSlug;

                  return (
                    <tr key={it.careItemSlug} className="border-b last:border-b border-[#3A0000]/20">
                      <td className="px-4 py-5 font-semibold">{it.label}</td>
                      <td className="px-4 py-5">
                        {isRowEditing ? (
                          <input
                            type="number"
                            min={0}
                            step={1}
                            value={itemAllocInput[it.careItemSlug] ?? String(it.allocated)}
                            onChange={(e) =>
                              setItemAllocInput((p) => ({ ...p, [it.careItemSlug]: e.target.value }))
                            }
                            className="w-28 text-right rounded-md bg-white text-black px-2 py-1 border"
                            disabled={loading}
                          />
                        ) : (
                          `$${it.allocated}`
                        )}
                      </td>
                      <td className="px-4 py-5">${it.spent.toLocaleString()}</td>
                      <td className={`px-4 py-5 ${rem < 0 ? 'text-red-600' : ''}`}>
                        {rem < 0 ? `-$${Math.abs(rem).toLocaleString()}` : `$${rem.toLocaleString()}`}
                      </td>
                      <td className="px-4 py-5">
                        <Badge tone={status.tone}>{status.label}</Badge>
                      </td>
                      <td className="px-4 py-5">
                        {isManagement && !isPastYear ? (
                          isRowEditing ? (
                            <div className="flex gap-2">
                              <button
                                onClick={() => void saveItem(it.careItemSlug)}
                                className="px-3 py-1 rounded-md bg-white text-black font-semibold hover:bg-black/10"
                                disabled={loading}
                              >
                                Save
                              </button>
                              <button
                                onClick={cancelEditItem}
                                className="px-3 py-1 rounded-md bg-white/80 text-black font-semibold hover:bg-white"
                                disabled={loading}
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => startEditItem(it.careItemSlug, it.allocated)}
                              className="px-3 py-1 rounded-md bg-white text-black font-semibold hover:bg-black/10"
                            >
                              Edit
                            </button>
                          )
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardChrome>
  );
}