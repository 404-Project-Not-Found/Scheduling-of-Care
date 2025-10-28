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
import { ArrowLeft, Search } from 'lucide-react';

import {
  getViewerRole,
  getActiveClient,
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
const getStatus = (
  remaining: number,
  allocated: number
): { tone: Tone; label: string } => {
  if (allocated === 0) return { tone: 'green', label: 'Not allocated' };
  if (remaining <= 0) return { tone: 'red', label: 'Used up' };
  const ratio = remaining / (allocated || 1);
  if (ratio <= LOW_BUDGET_THRESHOLD)
    return { tone: 'yellow', label: 'Nearly used up' };
  return { tone: 'green', label: 'Within Limit' };
};

const capitalise = (s = '') =>
  s.trim().replace(/^./u, (ch) => ch.toUpperCase());
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

  /* ===== Loading ===== */
  const [load, setLoad] = useState({ years: true, detail: true });
  const [saving, setSaving] = useState<{
    category: boolean;
    itemSlug: string | null;
  }>({
    category: false,
    itemSlug: null,
  });
  const loadingAny = load.years || load.detail;

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
      if (!active?.id) {
        router.push('/calendar_dashboard/budget_report');
        return;
      }
      setActiveClientId(active.id);
      setDisplayName(active.name || '');
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
    const fmt = new Intl.DateTimeFormat('en-AU', {
      dateStyle: 'long',
      timeZone: 'Australia/Melbourne',
    });
    setTodaysDate(fmt.format(d));
  }, [activeClientId]);

  // get years available in database
  useEffect(() => {
    const abort = new AbortController();
    const loadYears = async () => {
      if (!activeClientId) {
        setYears([]);
        return;
      }
      setLoad((s) => ({ ...s, years: true }));
      try {
        const list = await getAvailableYears(activeClientId, abort.signal);
        if (list.length > 0) {
          setYears(list);
          if (!list.includes(year)) setYear(list[0]);
        } else {
          const curr = new Date().getFullYear();
          setYears([curr]);
          setYear(curr);
        }
      } catch (e) {
        console.error('Failed to load years:', e);
        const curr = new Date().getFullYear();
        setYears([curr]);
        setYear(curr);
      } finally {
        setLoad((s) => ({ ...s, years: false }));
      }
    };
    loadYears();
    return () => abort.abort();
  }, [activeClientId]);

  /* ===== Budget ===== */
  const [detail, setDetail] = useState<CategoryDetail | null>(null);
  const [summary, setSummary] = useState<BudgetSummary>({
    annualAllocated: 0,
    spent: 0,
    remaining: 0,
    surplus: 0,
  });

  const reload = async () => {
    if (!activeClientId) {
      setDetail(null);
      return;
    }
    setLoad((s) => ({ ...s, detail: true }));
    try {
      const [d, s] = await Promise.all([
        getCategoryDetail(activeClientId, categoryId, year),
        getBudgetSummary(activeClientId, year),
      ]);
      setDetail(d);
      setSummary(s);
      setCategoryAmountInput(String(d.allocated ?? 0));
      const next: Record<string, string> = {};
      d.items.forEach((it) => {
        next[it.careItemSlug] = String(it.allocated ?? 0);
      });
      setItemEdits(next);
    } catch (e) {
      console.error(e);
      setDetail(null);
      setSummary({ annualAllocated: 0, spent: 0, remaining: 0, surplus: 0 });
    } finally {
      setLoad((s) => ({ ...s, detail: false }));
    }
  };

  useEffect(() => {
    void reload();
  }, [activeClientId, year, categoryId]);

  /** Live update by SSE */
  useEffect(() => {
    if (!activeClientId) return;
    const stop = openBudgetSSE(activeClientId, year, () => {
      void reload();
    });
    return () => stop();
    //eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeClientId, year, categoryId]);

  // load edit input
  const [categoryAmountInput, setCategoryAmountInput] = useState<string>('');

  const isPastYear = year < new Date().getFullYear();

  /** Editing state for category */
  const [isEditingCategory, setIsEditingCategory] = useState(false);

  const startEditCategory = () => {
    if (!detail) return;
    setCategoryAmountInput(String(detail.allocated ?? 0));
    setIsEditingCategory(true);
  };

  const cancelEditCategory = () => {
    if (!detail) return;
    setCategoryAmountInput(String(detail.allocated ?? 0));
    setIsEditingCategory(false);
  };

  const saveCategory = async () => {
    if (!activeClientId || !detail) return;
    const amount = Number(categoryAmountInput);
    if (!Number.isFinite(amount) || amount < 0) return;

    setSaving((s) => ({ ...s, category: true }));
    try {
      await setCategoryAllocation(
        activeClientId,
        year,
        categoryId,
        amount,
        detail.categoryName
      );
      await reload();
      setIsEditingCategory(false);
    } catch (e) {
      console.error('setCategory failed', e);
    } finally {
      setSaving((s) => ({ ...s, category: false }));
    }
  };

  /** Editing state for care item */
  const [editingItemSlug, setEditingItemSlug] = useState<string | null>(null);
  const [itemEdits, setItemEdits] = useState<Record<string, string>>({});
  const [itemAllocInput, setItemAllocInput] = useState<Record<string, string>>(
    {}
  );

  const startEditItem = (slug: string, currentAllocated: number) => {
    setItemAllocInput((p) => ({ ...p, [slug]: String(currentAllocated) }));
    setEditingItemSlug(slug);
  };

  const cancelEditItem = () => {
    setEditingItemSlug(null);
  };

  const saveItem = async (slug: string) => {
    if (!activeClientId) return;
    const amount = Number(itemAllocInput[slug] ?? '0');
    if (!Number.isFinite(amount) || amount < 0) return;

    setSaving({ category: false, itemSlug: slug });
    try {
      await setItemAllocation(activeClientId, year, categoryId, slug, amount);
      setEditingItemSlug(null);
      await reload();
    } catch (e) {
      console.error('setItem failed', e);
      setEditingItemSlug(slug);
    } finally {
      setSaving({ category: false, itemSlug: null });
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
      {/* Main scroll area */}
      <div
        className="flex-1 min-h-screen bg-[#FFF5EC] overflow-auto"
        aria-busy={loadingAny}
      >
        {/* Shared container for top bar + main content */}
        <div className="w-full max-w-8xl mx-auto px-6 md:px-12 py-6 md:py-10">
          {/* Top bar */}
          <div className="mb-8">
            {/* Title + Back button */}
            <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
              <h2 className="text-[#3A0000] text-3xl font-semibold">
                {niceCategoryName} Budget
              </h2>

              <button
                onClick={() => router.push('/calendar_dashboard/budget_report')}
                className="flex items-center gap-2 text-lg font-semibold text-[#3A0000] bg-[#EAD8C8] hover:bg-[#DFC8B4] border border-[#D4B8A0] rounded-md px-4 py-2 transition"
              >
                <ArrowLeft size={22} strokeWidth={2.5} />
                Back
              </button>
            </div>

            {/* Divider */}
            <hr className="w-full border-t border-[#3A0000]/25 rounded-full mb-6" />

            {/* Year selector + Search */}
            <div className="flex items-center justify-between flex-wrap gap-4 mb-4">
              {/* LEFT: Year selector */}
              <div className="flex items-center gap-2">
                <span className="font-semibold text-[#3A0000] text-lg">
                  Select year:
                </span>
                <select
                  value={String(year)}
                  onChange={(e) => setYear(Number(e.target.value))}
                  disabled={loadingAny}
                  className="rounded-md bg-white text-sm px-3 py-1 border"
                >
                  {years.map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
                {year === new Date().getFullYear() && todayDate && (
                  <span className="font-semibold text-black/70 text-sm ml-2">
                    As of {todayDate}
                  </span>
                )}
              </div>

              {/* RIGHT: Search */}
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search
                    size={20}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-black/60 pointer-events-none"
                  />
                  <input
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder="Search items"
                    className="h-9 rounded-full bg-white text-black border px-10"
                    disabled={loadingAny}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Main content */}
          {loadingAny ? (
            <div className="text-center py-32 text-gray-600 text-xl font-medium">
              Loading category budget…
            </div>
          ) : (
            <>
              {/* Warning: Over budget */}
              {detail && remaining < 0 && (
                <div className="mb-6 rounded-xl border border-yellow-400 bg-yellow-100 text-yellow-900 px-4 py-4 flex justify-between items-center">
                  <div className="font-semibold">
                    ⚠️ WARNING: Category exceeded by{' '}
                    <b>${Math.abs(remaining).toLocaleString()}</b>
                  </div>
                </div>
              )}

              {/* Warning: Low items */}
              {lowItems.length > 0 && (
                <div className="mb-6 rounded-lg border border-yellow-400 bg-yellow-100 px-6 py-4 text-yellow-800">
                  <div className="font-semibold mb-2">
                    ⚠️ The following items are nearing their budget limit:
                  </div>
                  <ul className="list-disc list-inside space-y-1">
                    {lowItems.map((it) => (
                      <li key={it.careItemSlug}>
                        <span className="font-medium">
                          {capitalise(it.label)}
                        </span>{' '}
                        — remaining ${(it.allocated - it.spent).toFixed(2)} (
                        {(
                          ((it.allocated - it.spent) / it.allocated) *
                          100
                        ).toFixed(1)}
                        %)
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Read-only notice */}
              {isPastYear && (
                <div className="mb-6 rounded-xl border border-yellow-400 bg-yellow-100 text-yellow-900 px-6 py-4">
                  The selected year ({year}) is read-only. Switch to{' '}
                  {new Date().getFullYear()} to edit this category.
                </div>
              )}

              {/* Summary tiles */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10 text-center items-stretch">
                {/* Category Budget */}
                <div className="rounded-2xl border px-4 py-8 bg-[#F8CBA6] h-full flex flex-col items-center justify-center text-center">
                  {isManagement && !isPastYear ? (
                    !isEditingCategory ? (
                      <>
                        <div className="text-2xl font-bold">
                          ${(detail?.allocated ?? 0).toLocaleString()}
                        </div>
                        <div className="text-sm">{niceCategoryName} Budget</div>

                        <div className="mt-4">
                          <button
                            onClick={startEditCategory}
                            disabled={loadingAny}
                            className="px-4 py-1.5 rounded-md font-semibold text-[#3A0000] transition"
                            style={{
                              background:
                                'linear-gradient(90deg, #F9C9B1 0%, #FBE8D4 100%)',
                              border: '1px solid #B47A64',
                              boxShadow: '0 2px 5px rgba(180, 122, 100, 0.25)',
                            }}
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
                          onChange={(e) =>
                            setCategoryAmountInput(e.target.value)
                          }
                          className="w-full max-w-[220px] mx-auto text-center text-2xl font-bold rounded-md bg-white text-black px-3 py-2 border"
                          disabled={saving.category}
                        />
                        <div className="text-sm mt-2">
                          {niceCategoryName} Budget
                        </div>

                        <div className="mt-4 flex items-center justify-center gap-3">
                          <button
                            onClick={saveCategory}
                            disabled={saving.category}
                            className="px-4 py-1.5 rounded-md font-semibold text-[#3A0000]"
                            style={{
                              background:
                                'linear-gradient(90deg, #F8CBA6 0%, #FBE8D4 100%)',
                              border: '1px solid #B47A64',
                              boxShadow: '0 2px 5px rgba(180, 122, 100, 0.25)',
                            }}
                          >
                            {saving.category ? 'Saving…' : 'Save'}
                          </button>
                          <button
                            onClick={cancelEditCategory}
                            disabled={saving.category}
                            className="px-4 py-1.5 rounded-md font-semibold text-[#3A0000] transition hover:opacity-80"
                            style={{
                              backgroundColor: '#EBD5C4',
                              border: '1px solid #C9A794',
                            }}
                          >
                            Cancel
                          </button>
                        </div>
                      </>
                    )
                  ) : (
                    <>
                      <div className="text-2xl font-bold">
                        ${(detail?.allocated ?? 0).toLocaleString()}
                      </div>
                      <div className="text-sm">{niceCategoryName} Budget</div>
                    </>
                  )}
                </div>

                {/* Spent */}
                <div className="rounded-2xl border px-4 py-8 bg-white flex flex-col items-center justify-center text-center h-full">
                  <div className="text-2xl font-bold">
                    ${(detail?.spent ?? 0).toLocaleString()}
                  </div>
                  <div className="text-sm">Spent to Date</div>
                </div>

                {/* Remaining */}
                <div className="rounded-2xl border px-4 py-8 bg-white flex flex-col items-center justify-center text-center h-full">
                  <div
                    className={`text-2xl font-bold ${
                      remaining < 0 ? 'text-red-600' : 'text-green-600'
                    }`}
                  >
                    {remaining < 0
                      ? `-$${Math.abs(remaining).toLocaleString()}`
                      : `$${remaining.toLocaleString()}`}
                  </div>
                  <div className="text-sm">Remaining Balance</div>
                </div>

                {/* Surplus */}
                <div className="rounded-2xl border px-4 py-8 bg-white flex flex-col items-center justify-center text-center h-full">
                  <div className="text-2xl font-bold text-black">
                    ${summary.surplus.toLocaleString()}
                  </div>
                  <div className="text-sm">Yearly Surplus</div>
                </div>
              </div>

              {/* Table */}
              <div className="rounded-2xl border border-[#3A0000]/30 bg-white overflow-hidden">
                <table className="w-full text-left text-sm bg-white">
                  <thead
                    className="text-[#3A0000] text-lg font-semibold"
                    style={{
                      backgroundColor: '#FBE8D4',
                      borderBottom: '2px solid rgba(58, 0, 0, 0.15)',
                    }}
                  >
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
                      const isSavingThisRow =
                        saving.itemSlug === it.careItemSlug;

                      return (
                        <tr
                          key={it.careItemSlug}
                          className="border-b last:border-b border-[#3A0000]/20"
                        >
                          <td className="px-4 py-5 font-semibold">
                            {capitalise(it.label)}
                          </td>
                          <td className="px-4 py-5">
                            {isRowEditing ? (
                              <input
                                type="number"
                                min={0}
                                step={1}
                                value={
                                  itemAllocInput[it.careItemSlug] ??
                                  String(it.allocated)
                                }
                                onChange={(e) =>
                                  setItemAllocInput((p) => ({
                                    ...p,
                                    [it.careItemSlug]: e.target.value,
                                  }))
                                }
                                className="w-28 text-right rounded-md bg-white text-black px-2 py-1 border"
                                disabled={isSavingThisRow}
                              />
                            ) : (
                              `$${it.allocated}`
                            )}
                          </td>
                          <td className="px-4 py-5">
                            ${it.spent.toLocaleString()}
                          </td>
                          <td
                            className={`px-4 py-5 ${
                              rem < 0 ? 'text-red-600' : ''
                            }`}
                          >
                            {rem < 0
                              ? `-$${Math.abs(rem).toLocaleString()}`
                              : `$${rem.toLocaleString()}`}
                          </td>
                          <td className="px-4 py-5">
                            <Badge tone={status.tone}>{status.label}</Badge>
                          </td>
                          <td className="px-4 py-5">
                            {isManagement && !isPastYear ? (
                              isRowEditing ? (
                                <div className="flex gap-2">
                                  <button
                                    onClick={() =>
                                      void saveItem(it.careItemSlug)
                                    }
                                    className="px-3 py-1 rounded-md bg-white text-black font-semibold hover:bg-black/10 disabled:opacity-60"
                                    disabled={isSavingThisRow}
                                  >
                                    {isSavingThisRow ? 'Saving…' : 'Save'}
                                  </button>
                                  <button
                                    onClick={cancelEditItem}
                                    className="px-3 py-1 rounded-md bg-white/80 text-black font-semibold hover:bg-white disabled:opacity-60"
                                    disabled={isSavingThisRow}
                                  >
                                    Cancel
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={() =>
                                    startEditItem(it.careItemSlug, it.allocated)
                                  }
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
            </>
          )}
        </div>
      </div>
    </DashboardChrome>
  );
}
