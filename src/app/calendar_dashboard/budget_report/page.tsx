/**
 * Budget Report
 * Front-end Authors: Vanessa Teo & Qingyue Zhao
 * Back-end Author: Zahra Rizqita
 *
 * - Underlines "Budget Report" in the top menu via page="budget".
 * - Pink banner title becomes "<Client>'s Budget" automatically.
 * - Management-only "Edit" to change Annual Budget and recalc Remaining.
 * - Layout: full-bleed (no inner white panel), header + content fill viewport.
 * - Fetches rows via getBudgetRowsFE(activeClientId).
 *
 * Updated by Denise Alexander (16/10/2025): Fixed active client usage, client dropdown
 * now works correctly.
 *
 * Updated by Zahra Rizqita (18/10/2025): Backend implemented -- mockApi no longer functional
 * Updated (16/10/2025): Fixed active client usage, client dropdown
 * now works correctly.
 *
 * Last Updated by Denise Alexander (20/10/2025): UI design and layout changes for readability,
 * consistency and better navigation.
 */

'use client';

import { Search } from 'lucide-react';
import React, { Suspense, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import DashboardChrome from '@/components/top_menu/client_schedule';
import Badge from '@/components/ui/Badge';

import {
  getViewerRole,
  getClients,
  getActiveClient,
  setActiveClient,
  type Client as ApiClient,
} from '@/lib/data';

import {
  invalidateBudgetFull,
  getBudgetRowsAndSum,
  openBudgetSSE,
  getAvailableYears,
  getCategoriesForClient,
  type BudgetRow,
  type BudgetSummary,
  type CategoryLite,
} from '@/lib/budget-helpers';

/* ---------------------------------- Types ---------------------------------- */
type Role = 'carer' | 'family' | 'management';

type ClientLite = {
  id: string;
  name: string;
  orgAccess?: 'approved' | 'pending' | 'revoked';
};

type ApiClientWithAccess = ApiClient & {
  orgAccess?: 'approved' | 'pending' | 'revoked';
};

/* ------------------------------- Chrome colors ------------------------------- */
const colors = {
  header: '#3A0000',
  banner: '#F9C9B1',
  text: '#2b2b2b',
};

/* ------------------------------- Utils ------------------------------- */
const capitalise = (s: string) => (s ? s[0].toUpperCase() + s.slice(1) : '');

/* ---------------------------------- Status  ---------------------------------- */
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

/* --------------------------------- Loading ---------------------------------- */
type LoadingState = {
  clientsLoad: boolean;
  yearsLoad: boolean;
  catLoad: boolean;
  budgetLoad: boolean;
  savingAnnualLoad: boolean;
  saveRowId: string | null;
};

/* --------------------------------- Page ---------------------------------- */
export default function BudgetReportPage() {
  return (
    <Suspense
      fallback={
        <div className="p-6 text-gray-600">Loading budget report...</div>
      }
    >
      <BudgetReportInner />
    </Suspense>
  );
}

function BudgetReportInner() {
  const router = useRouter();

  /* ------------------------------ Role ------------------------------ */
  const [role, setRole] = useState<Role>('carer');
  useEffect(() => {
    (async () => {
      try {
        const r = await getViewerRole();
        setRole(r);
      } catch (err) {
        console.error('Failed to get role.', err);
        setRole('carer');
      }
    })();
  }, []);

  // -- Banner Warning State
  const [showWarning, setShowWarning] = useState(false);
  const [warningText, setWarningText] = useState('');

  // -- Loading State
  const [loading, setLoading] = useState<LoadingState>({
    clientsLoad: true,
    yearsLoad: true,
    catLoad: true,
    budgetLoad: true,
    savingAnnualLoad: false,
    saveRowId: null,
  });
  const loadingAny =
    loading.clientsLoad ||
    loading.yearsLoad ||
    loading.catLoad ||
    loading.budgetLoad;

  /* ---------------------------- Clients ----------------------------- */
  const [clients, setClients] = useState<ClientLite[]>([]);
  const [activeClientId, setActiveClientId] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState<string>('');

  // Load clients + active client on mount
  useEffect(() => {
    let cancelled = false;
    setLoading((s) => ({ ...s, clientsLoad: true }));

    (async () => {
      try {
        const [list, active] = await Promise.all([getClients(), getActiveClient()]);

        if(cancelled) return;

        const mapped: ClientLite[] = (list as ApiClientWithAccess[]).map(
          (c) => ({
            id: c._id,
            name: c.name,
            orgAccess: c.orgAccess,
          })
        );
        setClients(mapped);
        setActiveClientId(active?.id ?? null);
        setDisplayName(active.name || '');
      } catch (err) {
        if(!cancelled) {
          console.error('Failed to fetch clients.', err);
          setClients([]);
          setActiveClientId(null);
          setDisplayName('');
        }
      } finally {
        if(!cancelled) setLoading((s) => ({ ...s, clientsLoad: false }));
      }
    })();
    return () => {cancelled = true}
  }, []);

  // Change active client
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

  // ===== Categories =====
  const [categories, setCategories] = useState<CategoryLite[]>([]);
  useEffect(() => {
    if (!activeClientId) {
        setCategories([]);
        return;
      }
    const abort = new AbortController();
    let cancelled = false;
    (async () => {
      setLoading((s) => ({ ...s, catLoad: true }));
      try {
        const cats = await getCategoriesForClient(activeClientId, abort.signal);
        if(cancelled) return;
        setCategories(cats);
      } catch (e) {
        if(!cancelled) {
          console.error('Failed to load categories:', e);
          setCategories([]);
        }
      } finally {
        if(!cancelled) setLoading((s) => ({ ...s, catLoad: false }));
      }
    })();
    return () => {
      cancelled = true;
      abort.abort();
    };
  }, [activeClientId]);

  // ===== Query and year =====
  const [q, setQ] = useState('');
  const [qDebounce, setQDebounce] = useState('');
  const [years, setYears] = useState<number[]>([]);
  const [todayDate, setTodaysDate] = useState<string>();
  const [year, setYear] = useState<number>(new Date().getFullYear());

  // reduce filtered recomputes on large tables
  useEffect(() => {
    const t = setTimeout(() => setQDebounce(q.trim().toLowerCase()), 150);
    return () => clearTimeout(t);
  }, [q]);

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
    if (!activeClientId) {
      setYears([]);
      return;
    }
    const abort = new AbortController();
    let cancelled = false;
    const load = async () => {
      setLoading((s) => ({ ...s, yearsLoad: true }));
      try {
        const list = await getAvailableYears(activeClientId, abort.signal);
        if(cancelled) return;
        if (list.length > 0) {
          setYears(list);
          if (!list.includes(year)) setYear(list[0]);
        } else {
          const curr = new Date().getFullYear();
          setYears([curr]);
          setYear(curr);
        }
      } catch (e) {
        if(!cancelled) {
          console.error('Failed to load years:', e);
          const curr = new Date().getFullYear();
          setYears([curr]);
          setYear(curr);
        }
      } finally {
        if(!cancelled) setLoading((s) => ({ ...s, yearsLoad: false }));
      }
    };
    load();
    return () => {
      cancelled = true;
      abort.abort();
    };
  }, [activeClientId]);

  // ===== Budget rows =====
  const [rows, setRows] = useState<BudgetRow[]>([]);
  const [summary, setSummary] = useState<BudgetSummary>({
    annualAllocated: 0,
    spent: 0,
    remaining: 0,
    surplus: 0,
  });


  // fetch rows + summary when client/year changes
  useEffect(() => {
    if (!activeClientId) {
      setRows([]);
      setSummary({ annualAllocated: 0, spent: 0, remaining: 0, surplus: 0 });
      return;
    }
    const abort = new AbortController();
    let cancelled = false;

    (async () => {
      setLoading((s) => ({ ...s, budgetLoad: true }));
      try {
        const full = await getBudgetRowsAndSum(activeClientId, year, abort.signal);
        if (cancelled) return;
        setRows(full.rows);
        setSummary(full.summary);
      } catch (e) {
        if (!cancelled) {
          console.error('Failed to load budget data:', e);
          setRows([]);
          setSummary({ annualAllocated: 0, spent: 0, remaining: 0, surplus: 0 });
        }
      } finally {
        if (!cancelled) setLoading((s) => ({ ...s, budgetLoad: false }));
      }
    })();

    return () => {
      cancelled = true;
      abort.abort();
    };
  }, [activeClientId, year]);


  // Real time update via SSE
  useEffect(() => {
    if (!activeClientId || loading.budgetLoad) return;

    let stop = () => {};
    const start = () => {
      stop = openBudgetSSE(activeClientId, year, async () => {
        try {
          invalidateBudgetFull(activeClientId, year);
          const full = await getBudgetRowsAndSum(activeClientId, year);
          React.startTransition?.(() => {
            setRows(full.rows);
            setSummary(full.summary);
          });
        } catch (e) {
          console.error('Refresh failed:', e);
        }
      });
    };

    const onVis = () => {
      if (document.hidden) {
        stop();
      } else {
        start();
      }
    };

    start();
    document.addEventListener('visibilitychange', onVis);
    return () => {
      stop();
      document.removeEventListener('visibilitychange', onVis);
    };
  }, [activeClientId, year, loading.budgetLoad]);

  const isPastYear = year < new Date().getFullYear();

  const rowsAll = useMemo(() => {
    const byId = new Map(rows.map((r) => [r.categoryId, r]));
    return categories.map((c) => {
      const r = byId.get(String(c.id));
      return (
        r ?? {
          categoryId: c.id,
          category: c.name,
          item: c.name,
          allocated: 0,
          spent: 0,
        }
      );
    });
  }, [categories, rows]);


  // ===== Editing state =====
  const [isEditing, setIsEditing] = useState(false);
  const [annualBudgetOverride, setAnnualBudgetOverride] = useState<
    number | null
  >(null);
  const [annualBudgetInput, setAnnualBudgetInput] = useState<string>('');

  const startEdit = () => {
    setIsEditing(true);
    setAnnualBudgetInput(String(summary.annualAllocated));
  };

  const saveAnnual = async () => {
    if (!activeClientId) return;
    const val = parseFloat(annualBudgetInput);
    if (!Number.isFinite(val) || val < 0) return;
    setLoading((s) => ({ ...s, savingAnnualLoad: true }));
    try {
      const res = await fetch(
        `/api/v1/clients/${encodeURIComponent(activeClientId)}/budget/manage`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          cache: 'no-store',
          body: JSON.stringify({ action: 'setAnnual', year, amount: val }),
        }
      );

      if (!res.ok) {
        const msg = await res.text();
        setWarningText(msg || 'Failed to save annual budget');
        setShowWarning(true);
        return;
      }

      const json = await res.json();
      if (json?.summary) {
        setSummary(json.summary);
      }
      invalidateBudgetFull(activeClientId, year);
      const full = await getBudgetRowsAndSum(activeClientId, year, undefined);
      setRows(full.rows);
      setSummary(full.summary);
      setShowWarning(false);
    } catch (e) {
      setWarningText('Network or server error while saving annual budget.');
      setShowWarning(true);
    } finally {
      setLoading((s) => ({ ...s, savingAnnualLoad: false }));
      setIsEditing(false);
    }
  };

  const [editingRowId, setEditingRowId] = useState<string | null>(null);
  const [allocInput, setAllocInput] = useState<Record<string, string>>({});

  const startEditRow = (row: BudgetRow) => {
    setEditingRowId(row.categoryId);
    setAllocInput((prev) => ({
      ...prev,
      [row.categoryId]: String(row.allocated),
    }));
  };

  const cancelEditRow = () => setEditingRowId(null);

  const saveRow = async (row: BudgetRow) => {
    if (!activeClientId) return;
    const raw = allocInput[row.categoryId];
    const amount = Number((raw ?? '').toString().replace(/,/g, ''));
    if (!Number.isFinite(amount) || amount < 0) {
      setWarningText('Allocated must be a non-negative number.');
      setShowWarning(true);
      return;
    }
    if (amount < row.spent) {
      setWarningText(
        `Allocated ($${amount}) cannot be less than Spent ($${row.spent}).`
      );
      setShowWarning(true);
      return;
    }
    setLoading((s) => ({ ...s, saveRowId: row.categoryId }));
    try {
      const res = await fetch(
        `/api/v1/clients/${encodeURIComponent(activeClientId)}/budget/manage`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          cache: 'no-store',
          body: JSON.stringify({
            action: 'setCategory',
            year,
            categoryId: row.categoryId,
            categoryName: row.category,
            amount,
          }),
        }
      );
      if (!res.ok) {
        const msg = await res.text();
        setWarningText(msg || 'Failed to save category budget.');
        setShowWarning(true);
        return;
      }
      invalidateBudgetFull(activeClientId, year);
      const full = await getBudgetRowsAndSum(activeClientId, year);
      setRows(full.rows);
      setSummary(full.summary);
      setShowWarning(false);
      setEditingRowId(null);
    } catch (e) {
      setWarningText('Network or server error while saving category budget.');
      setShowWarning(true);
    } finally {
      setLoading((s) => ({ ...s, saveRowId: null }));
    }
  };

  // deleting category
  const deleteCategoryRow = async (row: BudgetRow) => {
    if (!activeClientId) return;

    const catMeta = categories.find(
      (c) => String(c.id) === String(row.categoryId)
    );
    const catName = catMeta?.name ?? row.category;
    const catSlug: string | undefined =
      catMeta && 'slug' in catMeta ? (catMeta.slug as string) : undefined;
    const confirmed = window.confirm(
      `Delete the category “${catName}” for this client?\n\n` +
        `This will PERMANENTLY delete this category AND all care items under it. This action cannot be undone.`
    );
    if (!confirmed) return;

    try {
      const res = await fetch(
        `/api/v1/clients/${encodeURIComponent(activeClientId)}/category`,
        {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          cache: 'no-store',
          body: JSON.stringify({
            clientId: activeClientId,
            slug: catSlug,
            name: catSlug ? undefined : catName,
          }),
        }
      );

      if (!res.ok) {
        const msg = await res.text().catch(() => '');
        setWarningText(msg || 'Failed to delete category.');
        setShowWarning(true);
        return;
      }

      setCategories((prev) =>
        prev.filter((c) => String(c.id) !== String(row.categoryId))
      );
      setRows((prev) =>
        prev.filter((r) => String(r.categoryId) !== String(row.categoryId))
      );
      if (editingRowId === row.categoryId) setEditingRowId(null);

      setShowWarning(false);
    } catch (e) {
      setWarningText('Network or server error while deleting category.');
      setShowWarning(true);
    }
  };

  const lowCategories = useMemo(() => {
    return rowsAll
      .filter((r) => r.allocated > 0)
      .map((r) => {
        const remaining = r.allocated - r.spent;
        const ratio = remaining / r.allocated;
        return { name: r.category, remaining, percent: ratio * 100, show: remaining > 0 && ratio <= LOW_BUDGET_THRESHOLD };
      })
      .filter((x) => x.show)
      .map(({ name, remaining, percent }) => ({ name, remaining, percent }));
  }, [rowsAll]);


  const handleRollover = async (
    activeClientId: string,
    year: number,
    setRowsSetter: (r: BudgetRow[]) => void,
    setSummarySetter: (s: BudgetSummary) => void
  ) => {
    if (!activeClientId) return;
    try {
      await fetch(
        `/api/v1/clients/${encodeURIComponent(activeClientId)}/budget/manage`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          cache: 'no-store',
          body: JSON.stringify({
            action: 'rolloverFromPrev',
            fromYear: year - 1,
            toYear: year,
            copyCategories: true,
            bringSurplus: true,
            resetItemAllocations: false,
            overwriteIfExists: true,
          }),
        }
      );

      const full = await getBudgetRowsAndSum(activeClientId, year);

      setRowsSetter(full.rows);
      setSummarySetter(full.summary);
    } catch (err) {
      console.error('Rollover failed', err);
    }
  };

  /** Filter by search */
  const filtered = useMemo(() => {
    if(!qDebounce) return rowsAll;
    return rowsAll.filter(
      (r) =>
        r.item.toLowerCase().includes(qDebounce) || r.category.toLowerCase().includes(qDebounce)
    );
  }, [qDebounce, rowsAll]);

  /** Totals */
  const totals = useMemo(() => {
    const allocated = filtered.reduce((s, r) => s + r.allocated, 0);
    const spent = filtered.reduce((s, r) => s + r.spent, 0);
    return { allocated, spent, remaining: allocated - spent };
  }, [filtered]);

  const effectiveAllocated =
    annualBudgetOverride ?? summary.annualAllocated ?? totals.allocated;
  const effectiveRemaining = effectiveAllocated - totals.spent;

  /* ===== Render ===== */
  return (
    <DashboardChrome
      page="budget"
      clients={clients}
      onClientChange={onClientChange}
      colors={colors}
    >
      {/* Main scroll area */}
      <div
        className="flex-1 min-h-screen bg-[#FFF5EC] overflow-auto"
        aria-busy={loadingAny}
      >
        {/* Top bar */}
        <div className="w-full px-6 py-5">
          {/* Title */}
          <h2 className="text-[#3A0000] text-3xl font-semibold mb-3">
            Annual Budget
          </h2>

          {/* Divider */}
          <hr className="mt-4 mb-4 w-340 mx-auto border-t border-[#3A0000]/25 rounded-full" />

          {/* Year selector */}
          <div className="flex items-center justify-between flex-wrap gap-4 w-full">
            {/* LEFT: Year selector */}
            <div className="flex items-center gap-2">
              <span className="font-semibold text-[#3A0000] text-lg">
                Select year:
              </span>
              <select
                value={String(year)}
                onChange={(e) => setYear(Number(e.target.value))}
                disabled={loading.yearsLoad || loading.budgetLoad}
                className="rounded-md bg-white text-sm px-3 py-1 border"
              >
                {years.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
              {year === new Date().getFullYear() && (
                <span className="font-semibold text-black/70 text-sm ml-2">
                  As of {todayDate}
                </span>
              )}
            </div>

            {/* RIGHT: Search + Edit + Rollover for current year */}
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search
                  size={20}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-black/60 pointer-events-none"
                />
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Search"
                  disabled={loading.budgetLoad}
                  className="h-9 rounded-full bg-white text-black border px-10"
                />
              </div>

              {role === 'management' &&
                years.includes(year - 1) &&
                year === new Date().getFullYear() && (
                  <button
                    onClick={() =>
                      activeClientId && handleRollover(activeClientId!, year, setRows, setSummary)
                    }
                    disabled={loading.budgetLoad || !activeClientId}
                    className="px-3 py-1.5 rounded-md font-semibold text-[#3A0000] transition"
                    style={{
                      background:
                        'linear-gradient(90deg, #F9C9B1 0%, #FBE8D4 100%)',
                      border: '1px solid #B47A64',
                      boxShadow: '0 2px 5px rgba(180, 122, 100, 0.25)',
                    }}
                    title={`Copy categories and carry surplus from ${year - 1}`}
                  >
                    Roll over from {year - 1}
                  </button>
                )}
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="w-full px-6 md:px-12 py-6 md:py-10">
          {loadingAny ? (
            <div className="text-center py-32 text-gray-600 text-xl font-medium">
              Loading budget report…
            </div>
          ) : (
            <>
              {/* Warning banner */}
              {showWarning && (
                <div className="mb-6 rounded-xl border border-yellow-400 bg-yellow-100 text-yellow-900 px-6 py-4 flex justify-between items-center">
                  <div className="font-semibold">{warningText}</div>
                  <button
                    onClick={() => setShowWarning(false)}
                    className="ml-4 px-3 py-1 text-sm font-bold rounded-md bg-yellow-200 hover:bg-yellow-300"
                  >
                    Dismiss
                  </button>
                </div>
              )}

              {/* Read only for previous years */}
              {isPastYear && (
                <div className="mb-6 rounded-xl border border-yellow-400 bg-yellow-100 text-yellow-900 px-6 py-4">
                  The selected year ({year}) is read-only. Switch to{' '}
                  {new Date().getFullYear()} to edit the annual budget.
                </div>
              )}

              {/* Tiles : Annual, Spent, Remaining, Surplus) */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10 text-center">
                {/* Annual Budget */}
                <div className="rounded-2xl border px-6 py-8 bg-[#F8CBA6]">
                  {role === 'management' && isEditing ? (
                    <>
                      <input
                        type="number"
                        min={0}
                        step={1}
                        value={annualBudgetInput}
                        onChange={(e) => setAnnualBudgetInput(e.target.value)}
                        className="w-full max-w-[220px] mx-auto text-center text-2xl font-bold rounded-md bg-white text-black px-3 py-2 border"
                      />
                      <div className="text-sm mt-2">Annual Budget</div>

                      {/** Save / cancel inside tile */}
                      <div className="mt-4 flex items-center justify-center gap-3">
                        <button
                          onClick={saveAnnual}
                          disabled={loading.savingAnnualLoad || isPastYear}
                          className="px-4 py-1.5 rounded-md font-semibold text-[#3A0000] transition"
                          style={{
                            background:
                              'linear-gradient(90deg, #F8CBA6 0%, #FBE8D4 100%)',
                            border: '1px solid #B47A64',
                            boxShadow: '0 2px 5px rgba(180, 122, 100, 0.25)',
                          }}
                        >
                          {loading.savingAnnualLoad ? 'Saving…' : 'Save'}
                        </button>
                        <button
                          onClick={() => {
                            setIsEditing(false);
                            setAnnualBudgetInput('');
                          }}
                          disabled={loading.savingAnnualLoad}
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
                  ) : (
                    <>
                      <div className="text-2xl font-bold">
                        ${summary.annualAllocated.toLocaleString()}
                      </div>
                      <div className="text-sm">Annual Budget</div>

                      {/** Edit button */}
                      { role === 'management' && !isPastYear && (
                          <div className="mt-4">
                          <button
                            onClick={startEdit}
                            disabled={loading.budgetLoad}
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
                      )}
                    </>
                  )}
                </div>

                {/* Spent to Date */}
                <div className="rounded-2xl border px-6 py-8 bg-white">
                  <div className="text-2xl font-bold">
                    ${summary.spent.toLocaleString()}
                  </div>
                  <div className="text-sm">Spent to Date</div>
                </div>

                {/* Remaining */}
                <div className="rounded-2xl border px-6 py-8 bg-white">
                  <div
                    className={`text-2xl font-bold ${effectiveRemaining < 0 ? 'text-red-600' : 'text-green-600'}`}
                  >
                    {effectiveRemaining < 0
                      ? `-$${Math.abs(effectiveRemaining).toLocaleString()}`
                      : `$${effectiveRemaining.toLocaleString()}`}
                  </div>
                  <div className="text-sm">Remaining Balance</div>
                </div>

                {/* Surplus */}
                <div className="rounded-2xl border px-6 py-8 bg-white">
                  <div className="text-2xl font-bold text-black">
                    ${summary.surplus.toLocaleString()}
                  </div>
                  <div className="text-sm">Budget Surplus</div>
                </div>
              </div>

              {/* Low budget warning list */}
              {lowCategories.length > 0 && (
                <div className="mb-6 rounded-lg border border-yellow-400 bg-yellow-100 px-6 py-4 text-yellow-800">
                  <div className="font-semibold mb-2">⚠️ The following categories are nearing their budget limit:</div>
                  <ul className="list-disc list-inside space-y-1">
                    {lowCategories.map((c) => (
                      <li key={c.name}>
                        <span className="font-medium">{c.name}</span> — remaining ${c.remaining.toFixed(2)} ({c.percent.toFixed(1)}%)
                      </li>
                    ))}
                  </ul>
                </div>
              )}

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
                      <th className="px-4 py-4">Category</th>
                      <th className="px-4 py-4">Allocated</th>
                      <th className="px-4 py-4">Spent</th>
                      <th className="px-5 py-5">Remaining</th>
                      <th className="px-4 py-4">Status</th>
                      <th className="px-4 py-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((r) => {
                      const remaining = r.allocated - r.spent;
                      const status = getStatus(remaining, r.allocated);
                      return (
                        <tr
                          key={r.categoryId}
                          className="border-b last:border-b border-[#3A0000]/20"
                        >
                          <td className="px-4 py-5">
                            {r.allocated > 0 ? (
                              <Link
                                href={`/calendar_dashboard/budget_report/category-cost/${encodeURIComponent(
                                  r.categoryId
                                )}`}
                                className="font-bold text-black underline"
                              >
                                {r.category}
                              </Link>
                            ) : (
                              <span
                                className="font-bold text-gray-400 cursor-not-allowed"
                                title="Set a budget before viewing details"
                              >
                                {capitalise(r.category)}
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-5">
                            {editingRowId === r.categoryId ? (
                              <input
                                type="number"
                                min={0}
                                step={1}
                                value={
                                  allocInput[r.categoryId] ??
                                  String(r.allocated)
                                }
                                onChange={(e) =>
                                  setAllocInput((prev) => ({
                                    ...prev,
                                    [r.categoryId]: e.target.value,
                                  }))
                                }
                                className="w-28 text-right rounded-md bg-white text-black px-2 py-1 border"
                              />
                            ) : (
                              `$${r.allocated.toLocaleString()}`
                            )}
                          </td>
                          <td className="px-4 py-5">
                            ${r.spent.toLocaleString()}
                          </td>
                          <td
                            className={`px-4 py-5 ${remaining < 0 ? 'text-red-600' : ''}`}
                          >
                            {remaining < 0
                              ? `-$${Math.abs(remaining).toLocaleString()}`
                              : `$${remaining.toLocaleString()}`}
                          </td>
                          <td className="px-4 py-5">
                            <Badge tone={status.tone}>{status.label}</Badge>
                          </td>
                          <td className="px-4 py-5">
                            {role === 'management' && !isPastYear ? (
                              editingRowId === r.categoryId ? (
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => saveRow(r)}
                                    disabled={
                                      loading.saveRowId === r.categoryId
                                    }
                                    className="px-3 py-1 rounded-md bg-white text-black font-semibold hover:bg-black/10 disabled:opacity-60"
                                  >
                                    {loading.saveRowId === r.categoryId
                                      ? 'Saving…'
                                      : 'Save'}
                                  </button>
                                  <button
                                    onClick={cancelEditRow}
                                    disabled={
                                      loading.saveRowId === r.categoryId
                                    }
                                    className="px-3 py-1 rounded-md bg-white/80 text-black font-semibold hover:bg-white disabled:opacity-60"
                                  >
                                    Cancel
                                  </button>
                                  <button
                                    onClick={() => deleteCategoryRow(r)}
                                    disabled={
                                      loading.saveRowId === r.categoryId
                                    }
                                    className="whitespace-nowrap flex-shrink-0 px-4 py-2 rounded-md text-sm font-semibold text-white bg-[#B3261E] hover:bg-[#99201A] disabled:opacity-60"
                                    title="Permanently delete this category"
                                  >
                                    Delete Category
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => startEditRow(r)}
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

                  {filtered.length > 0 && (
                    <tfoot>
                      <tr className="bg-black/5 font-semibold">
                        <td className="px-4 py-4">Subtotal</td>
                        <td className="px-4 py-4">
                          ${totals.allocated.toLocaleString()}
                        </td>
                        <td className="px-4 py-4">
                          ${totals.spent.toLocaleString()}
                        </td>
                        <td className="px-4 py-4">
                          {totals.remaining < 0
                            ? `-$${Math.abs(totals.remaining).toLocaleString()}`
                            : `$${totals.remaining.toLocaleString()}`}
                        </td>
                        <td />
                        <td />
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            </>
          )}
        </div>
      </div>
    </DashboardChrome>
  );
}
