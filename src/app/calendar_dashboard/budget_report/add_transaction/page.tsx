/*
 * File path: /calendar_dashboard/add_transaction/page.tsx
 * Frontend Author: Devni Wijesinghe (refactor to use DashboardChrome by QY)
 * Backend Author: Zahra Rizqita
 */

'use client';

import React, { useEffect, useMemo, useRef, useState, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import DashboardChrome from '@/components/top_menu/client_schedule';

import { slugify } from '@/lib/slug';

import {
  getClients,
  getActiveClient,
  setActiveClient,
  type Client as ApiClient,
} from '@/lib/data';

type ClientLite = {
  id: string;
  name: string;
  orgAccess?: 'approved' | 'pending' | 'revoked';
};

type ApiClientWithAccess = ApiClient & {
  orgAccess?: 'approved' | 'pending' | 'revoked';
};

import { 
  addTransactionFE,
  getRefundablesFE,
  type CreatePurchaseBody,
  type CreateRefundBody,
  type PurchaseLineInput,
  type RefundableLine,
} from '@/lib/transaction-helpers';

import {
  getBudgetCategories,
  getBudgetRows,
  type CategoryLite,
  type BudgetRow
} from '@/lib/budget-helpers';
import { TypeQueryNode } from 'typescript';

const colors = {
  pageBg: '#FAEBDC',
  sectionBar: '#3A0000',
  label: '#000000',
  inputBorder: '#6C2B2B',
  banner: '#F9C9B1',
  header: '#3A0000',
  help: '#ED5F4F',
  btnPill: '#D2BCAF',
  btnPillHover: '#C7AEA0',
  fileBtn: '#E8D8CE',
};

type transKind = 'Purchase' | 'Refund';
type CarerLite = {id: string, name: string};
type CatLite = {id: string; name: string};
type CareItemLite = {
  id: string;
  label: string;
  slug: string;
  categoryId: string;
};

type AccessUser = {
  _id: string;
  fullName: string;
  email: string;
  role: 'family' | 'management' | 'carer';
};

async function fetchCarersForClient(clientId: string, signal?: AbortSignal): Promise<CarerLite[]> {
  const res = await fetch(
    `/api/v1/clients/${encodeURIComponent(clientId)}/access`,
    { cache: 'no-store', signal }
  );
  if (!res.ok) throw new Error('Failed to load access users');
  const data = (await res.json()) as Array<{
    _id: string;
    fullName: string;
    email: string;
    role: 'family' | 'management' | 'carer';
  }>;
  // filter only carers
  return data
    .filter(u => u.role === 'carer')
    .map(u => ({ id: u._id, name: u.fullName, email: u.email }));
}

export default function AddTransactionPage() {
  return (
    <Suspense fallback={<div className="p-6 text-gray-600">Loading…</div>}>
      <AddTransactionInner />
    </Suspense>
  );
}

function AddTransactionInner() {
  const router = useRouter();
  const [transType, setTransType] = useState<transKind>('Purchase');
  const[date, setDate] = useState('');


  const [year, setYear] = useState<number>(2025);

  /* ---------- Top bar client dropdown ---------- */
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

  /* ---------- Carer dropdown ---------- */
  const [carers, setCarers] = useState<CarerLite[]>([]);
  const [madeByUserId, setMadeByUserId] = useState('demo-user-id'); // which carer
  const [madeByFallback, setMadeByFallback] = useState<string>('');

  useEffect(() => {
  let abort = new AbortController();
  (async () => {
    if (!activeClientId) { setCarers([]); setMadeByUserId(''); return; }
    try {
      const list = await fetchCarersForClient(activeClientId, abort.signal);
      setCarers(list);
      setMadeByUserId(list[0]?.id ?? '')
    } catch {
      setCarers([]);
      setMadeByUserId('');
    }
  })();
  return () => abort.abort();
}, [activeClientId]);
  /* ---------- Care Item Catalog + Tasks ---------- */
  const [categories, setCategories] = useState<CategoryLite[]>([]);
  const [budgetRows, setBudgetRows] = useState<BudgetRow[]>([]);
  const [careItems, setCareItems] = useState<CareItemLite[]>([]);
  useEffect(() => {
    let abort = new AbortController();
    (async () => {
      if (!activeClientId) { setCategories([]); setCareItems([]); return; }
      try {
        const [cats, items] = await Promise.all([
          fetch(`/api/v1/clients/${encodeURIComponent(activeClientId)}/category`, { cache: 'no-store', signal: abort.signal })
            .then(async (r) => {
              if (!r.ok) throw new Error('cat');
              const data = (await r.json()) as Array<{ _id: string; name: string }>;
              return data.map<CategoryLite>((c) => ({ id: String(c._id), name: String(c.name) }));
            }),
          fetch(`/api/v1/clients/${encodeURIComponent(activeClientId)}/care_item/transaction`, { cache: 'no-store', signal: abort.signal })
            .then(async (r) => {
              if (!r.ok) throw new Error('ci');
              const data = (await r.json()) as Array<{
                _id: string; label: string; slug: string; categoryId: string;
              }>;
              return data.map<CareItemLite>((ci) => ({
                id: String(ci._id),
                label: String(ci.label),
                slug: String(ci.slug),
                categoryId: String(ci.categoryId),
              }));
            }),
        ]);
        setCategories(cats);
        setCareItems(items);
      } catch {
        setCategories([]);
        setCareItems([]);
      }
    })();
    return () => abort.abort();
  }, [activeClientId]);

  const careItemsByCategoryId = useMemo(() => {
    const m = new Map<string, CareItemLite[]>();
    careItems.forEach((ci) => {
      const arr = m.get(ci.categoryId) ?? [];
      arr.push(ci);
      m.set(ci.categoryId, arr);
    });
    // sort by label for nicer UX
    m.forEach((arr) => arr.sort((a, b) => a.label.localeCompare(b.label)));
    return m;
  }, [careItems]);

  /* ---------- Form state ---------- */
  const [note, setNote] = useState('');
  const [receiptFile, setReceiptFile] = useState<File | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  type PurchaseLine = {
    id: string;
    categoryId: string;
    categoryName: string;
    careItemSlug: string;
    label: string;
    amount: string;
  };
  // Purchase lines
  const [purchaseLines, setPurchaseLines] = useState<PurchaseLine[]>([
    { id: 'p1', categoryId: '', categoryName: '', careItemSlug: '', label: '', amount: '' },
  ]);

  const addPurchaseLine = () =>
    setPurchaseLines((prev) => [
      ...prev,
      { id: `l${Date.now()}`, categoryId: '', categoryName: '', careItemSlug: '', label: '', amount: '' },
    ]);

  const removePurchaseLine = (id: string) =>
    setPurchaseLines((prev) => (prev.length > 1 ? prev.filter((l) => l.id !== id) : prev));

  const updatePurchaseLine = (id: string, patch: Partial<PurchaseLine>) =>
    setPurchaseLines((prev) => prev.map((l) => (l.id === id ? { ...l, ...patch } : l)));

  /* --------------------------- Refund -------------------------------*/
  const [refundables, setRefundables] = useState<RefundableLine[]>([]);
  const [refundLines, setRefundLines] = useState< { id: string; categoryId: string; careItemSlug: string; occurrenceKey: string; amount: string }[] >([{ id: 'r1', categoryId: '', careItemSlug: '', occurrenceKey: '', amount: '' }]);

  useEffect(() => {
    let abort = new AbortController();
    (async () => {
      if (!activeClientId || transType !== 'Refund') { setRefundables([]); return; }
      try {
        const rows = await getRefundablesFE(activeClientId, year, abort.signal);
        setRefundables(rows);
      } catch {
        setRefundables([]);
      }
    })();
    return () => abort.abort();
  }, [activeClientId, year, transType]);

  const addRefundLine = () =>
    setRefundLines((prev) => [...prev, { id: `r${Date.now()}`, categoryId: '', careItemSlug: '', occurrenceKey: '', amount: '' }]);

  const removeRefundLine = (id: string) =>
    setRefundLines((prev) => (prev.length > 1 ? prev.filter((l) => l.id !== id) : prev));

  const updateRefundLine = (id: string, patch: Partial<(typeof refundLines)[number]>) =>
    setRefundLines((prev) => prev.map((l) => (l.id === id ? { ...l, ...patch } : l)));

  // Lookup for refund dropdown
  const catNameById = useMemo(() => {
    const m = new Map<string, string>();
    categories.forEach((c) => m.set(c.id, c.name));
    return m;
  }, [categories]);

  const refundableByCategory= useMemo(() => {
    const m = new Map<string, RefundableLine[]>();
    refundables.forEach((r) => {
      const arr = m.get(r.categoryId) ?? [];
      arr.push(r);
      m.set(r.categoryId, arr) ?? [];
    });
    return m;
  }, [refundables]);

  const catIdsWithRefundables = useMemo(
    () => Array.from(refundables.keys()).map(String),
    [refundableByCategory]
  );

  const itemSlugsByCategory = useMemo(() => {
    const m = new Map<string, string[]>();
    refundables.forEach((r) => {
      const key = r.categoryId;
      const arr = m.get(key) ?? [];
      if (!arr.includes(r.careItemSlug)) arr.push(r.careItemSlug);
      m.set(key, arr);
    });
    return m;
  }, [refundables]);

  const occurrencesByCatAndItem = useMemo(() => {
    const m = new Map<string, RefundableLine[]>();
    refundables.forEach((r) => {
      const key = `${r.categoryId}:${r.careItemSlug}`;
      const arr = m.get(key) ?? [];
      arr.push(r);
      m.set(key, arr);
    });
    return m;
  }, [refundables]);

  /* --------------------------- Submit -------------------------------*/
  const handleSubmit = async () => {
    if (!activeClientId) {
      alert('Please select a client in the banner first.');
      return;
    }
    if (!date) {
      alert('Please choose a date.');
      return;
    }

    const receiptUrl = receiptFile ? `/uploads/${receiptFile.name}` : undefined;

    const madeByIdToSend =
      carers.length > 0 && madeByUserId ? madeByUserId : madeByFallback.trim();

    if (!madeByIdToSend) {
      alert('Please select or enter the carer/user who made this transaction.');
      return;
    }

    if (transType === 'Purchase') {
      if (purchaseLines.some((l) => !l.categoryId || !l.careItemSlug || !l.amount.trim())) {
        alert('Each purchase line needs Category, Care Item and Amount.');
        return;
      }
      const lines: PurchaseLineInput[] = purchaseLines.map((l) => ({
        categoryId: l.categoryId,
        careItemSlug: l.careItemSlug,
        label: l.label,
        amount: Number(l.amount),
      }));
      if (lines.some((l) => !Number.isFinite(l.amount) || l.amount <= 0)) {
        alert('Amounts must be positive numbers.');
        return;
      }

      const payload: CreatePurchaseBody = {
        type: 'Purchase',
        date,
        madeByUserId: madeByIdToSend,
        receiptUrl,
        note,
        lines,
      };

      try {
        await addTransactionFE(activeClientId, payload);
        router.push('/calendar_dashboard/transaction_history');
      } catch (e) {
        console.error(e);
        alert('Failed to add transaction.');
      }
      return;
    }

    // Refund branch
    const chosen = refundLines.filter(
      (r) => r.categoryId && r.careItemSlug && r.occurrenceKey && r.amount.trim()
    );
    if (chosen.length === 0) {
      alert('Select at least one refund line with a valid amount.');
      return;
    }

    for (const r of chosen) {
      const [refundOfTransId, refundOfLineId] = r.occurrenceKey.split(':');
      const occ = refundables.find(
        (o) => o.purchaseTransId === refundOfTransId && o.lineId === refundOfLineId
      );
      const amt = Number(r.amount);
      if (!occ || !Number.isFinite(amt) || amt <= 0) {
        alert('Invalid refund amount.');
        return;
      }
      if (amt > occ.remainingRefundable) {
        alert(
          `Refund for "${occ.label ?? occ.careItemSlug}" exceeds remaining ($${occ.remainingRefundable.toFixed(2)}).`
        );
        return;
      }
    }

    const refundPayload: CreateRefundBody = {
      type: 'Refund',
      date,
      madeByUserId: madeByIdToSend,
      receiptUrl,
      note,
      lines: chosen.map((r) => {
        const [refundOfTransId, refundOfLineId] = r.occurrenceKey.split(':');
        return {
          refundOfTransId,
          refundOfLineId,
          amount: Number(r.amount),
        };
      }),
    };

    try {
      await addTransactionFE(activeClientId, refundPayload);
      router.push('/calendar_dashboard/transaction_history');
    } catch (e) {
      console.error(e);
      alert('Failed to add refund.');
    }
  };

  const inputCls =
    'h-12 w-[600px] rounded-sm px-3 bg-white text-black outline-none border';
  const inputStyle = { borderColor: colors.inputBorder };

  return (
    <DashboardChrome
      page="transactions"
      clients={clients}
      onClientChange={onClientChange}
      colors={{ header: colors.header, banner: colors.banner, text: '#000' }}
    >
      <div className="flex-1 h-[680px] overflow-auto" style={{ backgroundColor: colors.pageBg }}>
        {/* Section bar */}
        <div
          className="w-full flex items-center justify-between px-8 py-4 text-white text-3xl font-extrabold"
          style={{ backgroundColor: colors.sectionBar }}
        >
          <span>Add Transaction</span>
          <div className="flex items-center gap-4">
            <select
              value={String(year)}
              onChange={(e) => setYear(Number(e.target.value))}
              className="rounded bg-white text-black px-3 py-1 text-base"
            >
              <option value="2025">2025</option>
              <option value="2024">2024</option>
              <option value="2023">2023</option>
            </select>
            <button
              onClick={() => router.push('/calendar_dashboard/transaction_history')}
              className="text-lg font-semibold text-white hover:underline"
            >
              &lt; Back
            </button>
          </div>
        </div>

        {/* Form area */}
        <div className="w-full max-w-[900px] mx-auto px-6 py-8">
          <div className="grid grid-cols-1 gap-6">
            {/* Type */}
            <div className="flex flex-col gap-2">
              <label className="text-2xl font-extrabold" style={{ color: colors.label }}>
                Transaction Type
              </label>
              <select
                value={transType}
                onChange={(e) => setTransType(e.target.value as transKind)}
                className={`${inputCls} w-[280px]`}
                style={inputStyle}
              >
                <option value="Purchase">Purchase</option>
                <option value="Refund">Refund</option>
              </select>
            </div>

            {/* Date */}
            <div className="flex flex-col gap-2">
              <label className="text-2xl font-extrabold" style={{ color: colors.label }}>
                Date
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className={`${inputCls} w-[280px]`}
                style={inputStyle}
              />
            </div>

            {/* Carer/User */}
            <div className="flex flex-col gap-2">
              <label className="text-2xl font-extrabold" style={{ color: colors.label }}>
                Made By (Carer / User)
              </label>
              {carers.length > 0 ? (
                <select
                  value={madeByUserId}
                  onChange={(e) => setMadeByUserId(e.target.value)}
                  className={`${inputCls} w-[420px]`}
                  style={inputStyle}
                >
                  {carers.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  value={madeByFallback}
                  onChange={(e) => setMadeByFallback(e.target.value)}
                  placeholder="Enter user id or name"
                  className={`${inputCls} w-[420px]`}
                  style={inputStyle}
                />
              )}
            </div>

            {/* Note */}
            <div className="flex flex-col gap-2">
              <label className="text-2xl font-extrabold" style={{ color: colors.label }}>
                Note (optional)
              </label>
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className={`${inputCls} w-full`}
                style={inputStyle}
                placeholder="Optional note"
              />
            </div>

            {/* Receipt */}
            <div className="flex flex-col gap-2">
              <label className="text-2xl font-extrabold" style={{ color: colors.label }}>
                Upload Receipt
              </label>
              <div className="flex items-center gap-4">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,.pdf"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files?.length) setReceiptFile(e.target.files[0]);
                  }}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 rounded-md font-semibold"
                  style={{
                    backgroundColor: colors.fileBtn,
                    border: `1px solid ${colors.inputBorder}`,
                    color: '#1a1a1a',
                  }}
                >
                  Choose file
                </button>
                <span className="text-black">
                  {receiptFile ? receiptFile.name : 'No file chosen'}
                </span>
              </div>
            </div>

            {/* Lines (stacked vertically) */}
            <div className="flex flex-col gap-6">
              {transType === 'Purchase' ? (
                <>
                  <div className="text-xl font-bold" style={{ color: colors.label }}>
                    Purchase Lines
                  </div>
                  {purchaseLines.map((l) => {
                    const itemsForCat = l.categoryId ? (careItemsByCategoryId.get(l.categoryId) ?? []) : [];
                    return (
                      <div key={l.id} className="rounded-xl border p-4 bg-white flex flex-col gap-4">
                        {/* Category */}
                        <div className="flex flex-col gap-2">
                          <label className="font-semibold">Category</label>
                          <select
                            value={l.categoryId}
                            onChange={(e) =>
                              updatePurchaseLine(l.id, {
                                categoryId: e.target.value,
                                careItemSlug: '',
                                label: '',
                              })
                            }
                            className={`${inputCls} w-[360px]`}
                            style={inputStyle}
                          >
                            <option value="">Select a category</option>
                            {categories.map((c) => (
                              <option key={c.id} value={c.id}>
                                {c.name}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Care Item */}
                        <div className="flex flex-col gap-2">
                          <label className="font-semibold">Care Item</label>
                          <select
                            value={l.careItemSlug}
                            onChange={(e) => {
                              const slug = e.target.value;
                              const found = itemsForCat.find((ci) => ci.slug === slug);
                              updatePurchaseLine(l.id, {
                                careItemSlug: slug,
                                label: found?.label ?? '',
                              });
                            }}
                            disabled={!l.categoryId}
                            className={`${inputCls} w-[360px]`}
                            style={inputStyle}
                          >
                            <option value="">Select a care item</option>
                            {itemsForCat.map((ci) => (
                              <option key={ci.id} value={ci.slug}>
                                {ci.label}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Amount */}
                        <div className="flex flex-col gap-2">
                          <label className="font-semibold">Amount</label>
                          <input
                            type="number"
                            min={0}
                            step="0.01"
                            value={l.amount}
                            onChange={(e) => updatePurchaseLine(l.id, { amount: e.target.value })}
                            placeholder="0.00"
                            className={`${inputCls} w-[200px] text-right`}
                            style={inputStyle}
                          />
                        </div>

                        {/* Remove line */}
                        <div>
                          <button
                            type="button"
                            onClick={() => removePurchaseLine(l.id)}
                            className="px-3 py-2 rounded-md border hover:bg-black/5"
                          >
                            Remove line
                          </button>
                        </div>
                      </div>
                    );
                  })}

                  <button
                    type="button"
                    onClick={addPurchaseLine}
                    className="mt-2 px-4 py-2 rounded-md border font-semibold hover:bg-black/5 w-max"
                  >
                    + Add another line
                  </button>
                </>
              ) : (
                <>
                  <div className="text-xl font-bold" style={{ color: colors.label }}>
                    Refund Lines 
                  </div>

                  {refundLines.map((l) => {
                    const itemOptions = l.categoryId ? (itemSlugsByCategory.get(l.categoryId) ?? []) : [];
                    const occurrences =
                      l.categoryId && l.careItemSlug
                        ? occurrencesByCatAndItem.get(`${l.categoryId}:${l.careItemSlug}`) ?? []
                        : [];
                    const selectedOcc = occurrences.find(
                      (o) => `${o.purchaseTransId}:${o.lineId}` === l.occurrenceKey
                    );

                    return (
                      <div key={l.id} className="rounded-xl border p-4 bg-white flex flex-col gap-4">
                        {/* Category (only those with refundable lines) */}
                        <div className="flex flex-col gap-2">
                          <label className="font-semibold">Category (refundable)</label>
                          <select
                            value={l.categoryId}
                            onChange={(e) =>
                              updateRefundLine(l.id, { categoryId: e.target.value, careItemSlug: '', occurrenceKey: '' })
                            }
                            className={`${inputCls} w-[360px]`}
                            style={inputStyle}
                          >
                            <option value="">Select a category</option>
                            {catIdsWithRefundables.map((id) => (
                              <option key={id} value={id}>
                                {catNameById.get(id) ?? id}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Care Item */}
                        <div className="flex flex-col gap-2">
                          <label className="font-semibold">Care Item</label>
                          <select
                            value={l.careItemSlug}
                            onChange={(e) => updateRefundLine(l.id, { careItemSlug: e.target.value, occurrenceKey: '' })}
                            disabled={!l.categoryId}
                            className={`${inputCls} w-[360px]`}
                            style={inputStyle}
                          >
                            <option value="">Select a care item</option>
                            {itemOptions.map((slug) => (
                              <option key={slug} value={slug}>
                                {slug}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Purchase occurrence */}
                        <div className="flex flex-col gap-2">
                          <label className="font-semibold">Purchase occurrence</label>
                          <select
                            value={l.occurrenceKey}
                            onChange={(e) => updateRefundLine(l.id, { occurrenceKey: e.target.value })}
                            disabled={!l.categoryId || !l.careItemSlug}
                            className={`${inputCls} w-[480px]`}
                            style={inputStyle}
                          >
                            <option value="">Select purchase occurrence</option>
                            {occurrences.map((o) => (
                              <option key={`${o.purchaseTransId}:${o.lineId}`} value={`${o.purchaseTransId}:${o.lineId}`}>
                                {o.purchaseDate} • orig ${o.originalAmount.toFixed(2)} • rem ${o.remainingRefundable.toFixed(2)}
                              </option>
                            ))}
                          </select>
                          {selectedOcc && l.amount && Number(l.amount) > 0 && (
                            <div className="text-sm text-gray-700">
                              Remaining available: ${selectedOcc.remainingRefundable.toFixed(2)}
                            </div>
                          )}
                        </div>

                        {/* Amount */}
                        <div className="flex flex-col gap-2">
                          <label className="font-semibold">Amount</label>
                          <input
                            type="number"
                            min={0}
                            step="0.01"
                            value={l.amount}
                            onChange={(e) => updateRefundLine(l.id, { amount: e.target.value })}
                            placeholder="0.00"
                            className={`${inputCls} w-[200px] text-right`}
                            style={inputStyle}
                          />
                        </div>

                        {/* Remove line */}
                        <div>
                          <button
                            type="button"
                            onClick={() => removeRefundLine(l.id)}
                            className="px-3 py-2 rounded-md border hover:bg-black/5"
                          >
                            Remove line
                          </button>
                        </div>
                      </div>
                    );
                  })}

                  <button
                    type="button"
                    onClick={addRefundLine}
                    className="mt-2 px-4 py-2 rounded-md border font-semibold hover:bg-black/5 w-max"
                  >
                    + Add another refund line
                  </button>
                </>
              )}
            </div>

            {/* Footer buttons */}
            <div className="mt-6 flex items-center justify-center gap-10">
              <button
                className="px-8 py-3 rounded-2xl text-2xl font-extrabold"
                style={{ backgroundColor: colors.btnPill, color: '#1a1a1a' }}
                onClick={() => router.push('/calendar_dashboard/transaction_history')}
              >
                Cancel
              </button>
              <button
                className="px-10 py-3 rounded-2xl text-2xl font-extrabold hover:opacity-95"
                style={{ backgroundColor: colors.btnPill, color: '#1a1a1a' }}
                onClick={handleSubmit}
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