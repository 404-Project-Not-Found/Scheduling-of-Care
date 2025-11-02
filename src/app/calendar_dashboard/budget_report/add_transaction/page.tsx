/*
 * File path: /calendar_dashboard/add_transaction/page.tsx
 * Frontend Author: Devni Wijesinghe (refactor to use DashboardChrome by QY)
 * Backend Author: Zahra Rizqita
 *
 * Updated by Denise Alexander (20/10/2025): UI design and layout changes for readability,
 * consistency and better navigation.
 *
 * Last Updated by Denise Alexander (23/10/2025): Changed design of cancel and save buttons for
 * consistent UI.
 */

'use client';

import React, { useEffect, useMemo, useRef, useState, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

import DashboardChrome from '@/components/top_menu/client_schedule';
import { toISODateOnly } from '@/lib/care-item-helpers/date-helpers';
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

import { type CategoryLite } from '@/lib/budget-helpers';

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
type CarerLite = { id: string; name: string };
type CareItemLite = {
  id: string;
  label: string;
  slug: string;
  categoryId: string;
};

async function fetchCarersForClient(
  clientId: string,
  signal?: AbortSignal
): Promise<CarerLite[]> {
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
  // only carers, return id+name to match CarerLite
  return data
    .filter((u) => u.role === 'carer' || u.role === 'management')
    .map((u) => ({ id: u._id, name: u.fullName }));
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
  const [date, setDate] = useState<string>(() => toISODateOnly(new Date()));
  const [load, setLoad] = useState({
    clients: true,
    carers: true,
    catalog: true,
    refundables: false,
  });
  const loadAny =
    load.clients || load.carers || load.catalog || load.refundables;

  const year = useMemo(() => new Date(date).getFullYear(), [date]);

  /* ---------- Top bar client dropdown ---------- */
  const [clients, setClients] = useState<ClientLite[]>([]);
  const [activeClientId, setActiveClientId] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState<string>('');

  useEffect(() => {
    (async () => {
      setLoad((s) => ({ ...s, clients: true }));
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
      } finally {
        setLoad((s) => ({ ...s, clients: false }));
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
  const [madeByUserId, setMadeByUserId] = useState(''); // which carer
  const [madeByFallback, setMadeByFallback] = useState<string>('');

  useEffect(() => {
    const abort = new AbortController();
    (async () => {
      setLoad((s) => ({ ...s, carers: true }));
      if (!activeClientId) {
        setCarers([]);
        setMadeByUserId('');
        return;
      }
      try {
        const list = await fetchCarersForClient(activeClientId, abort.signal);
        setCarers(list);
        setMadeByUserId(list[0]?.id ?? '');
      } catch {
        setCarers([]);
        setMadeByUserId('');
      } finally {
        setLoad((s) => ({ ...s, carers: false }));
      }
    })();
    return () => abort.abort();
  }, [activeClientId]);

  /* ---------- Care Item Catalog + Tasks ---------- */
  const [categories, setCategories] = useState<CategoryLite[]>([]);
  const [careItems, setCareItems] = useState<CareItemLite[]>([]);
  useEffect(() => {
    const abort = new AbortController();
    (async () => {
      setLoad((s) => ({ ...s, catalog: true }));
      if (!activeClientId) {
        setCategories([]);
        setCareItems([]);
        return;
      }
      try {
        const [cats, items] = await Promise.all([
          fetch(
            `/api/v1/clients/${encodeURIComponent(activeClientId)}/category`,
            {
              cache: 'no-store',
              signal: abort.signal,
            }
          ).then(async (r) => {
            if (!r.ok) throw new Error('cat');
            const data = (await r.json()) as Array<{
              _id: string;
              name: string;
            }>;
            return data.map<CategoryLite>((c) => ({
              id: String(c._id),
              name: String(c.name),
            }));
          }),
          fetch(
            `/api/v1/clients/${encodeURIComponent(activeClientId)}/care_item/transaction`,
            {
              cache: 'no-store',
              signal: abort.signal,
            }
          ).then(async (r) => {
            if (!r.ok) throw new Error('ci');
            const data = (await r.json()) as Array<{
              _id: string;
              label: string;
              slug: string;
              categoryId: string;
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
      } finally {
        setLoad((s) => ({ ...s, catalog: false }));
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

  const [purchaseLines, setPurchaseLines] = useState<PurchaseLine[]>([
    {
      id: 'p1',
      categoryId: '',
      categoryName: '',
      careItemSlug: '',
      label: '',
      amount: '',
    },
  ]);

  const addPurchaseLine = () =>
    setPurchaseLines((prev) => [
      ...prev,
      {
        id: `l${Date.now()}`,
        categoryId: '',
        categoryName: '',
        careItemSlug: '',
        label: '',
        amount: '',
      },
    ]);

  const removePurchaseLine = (id: string) =>
    setPurchaseLines((prev) =>
      prev.length > 1 ? prev.filter((l) => l.id !== id) : prev
    );

  const updatePurchaseLine = (id: string, patch: Partial<PurchaseLine>) =>
    setPurchaseLines((prev) =>
      prev.map((l) => (l.id === id ? { ...l, ...patch } : l))
    );

  /* --------------------------- Refund -------------------------------*/
  const [refundables, setRefundables] = useState<RefundableLine[]>([]);
  const [refundLines, setRefundLines] = useState<
    {
      id: string;
      categoryId: string;
      careItemSlug: string;
      occurrenceKey: string;
      amount: string;
    }[]
  >([
    {
      id: 'r1',
      categoryId: '',
      careItemSlug: '',
      occurrenceKey: '',
      amount: '',
    },
  ]);

  useEffect(() => {
    const abort = new AbortController();
    (async () => {
      if (!activeClientId || transType !== 'Refund') {
        setRefundables([]);
        setLoad((s) => ({ ...s, refundables: false }));
        return;
      }
      setLoad((s) => ({ ...s, refundables: true }));
      try {
        const rows = await getRefundablesFE(activeClientId, year, abort.signal);
        setRefundables(rows);
      } catch {
        setRefundables([]);
      } finally {
        setLoad((s) => ({ ...s, refundables: false }));
      }
    })();
    return () => abort.abort();
  }, [activeClientId, year, transType]);

  const addRefundLine = () =>
    setRefundLines((prev) => [
      ...prev,
      {
        id: `r${Date.now()}`,
        categoryId: '',
        careItemSlug: '',
        occurrenceKey: '',
        amount: '',
      },
    ]);

  const removeRefundLine = (id: string) =>
    setRefundLines((prev) =>
      prev.length > 1 ? prev.filter((l) => l.id !== id) : prev
    );

  const updateRefundLine = (
    id: string,
    patch: Partial<(typeof refundLines)[number]>
  ) =>
    setRefundLines((prev) =>
      prev.map((l) => (l.id === id ? { ...l, ...patch } : l))
    );

  // Lookups for refund dropdowns
  const catNameById = useMemo(() => {
    const m = new Map<string, string>();
    categories.forEach((c) => m.set(c.id, c.name));
    return m;
  }, [categories]);

  const purchasedCatIds = useMemo(
    () => Array.from(new Set(refundables.map((r) => r.categoryId))),
    [refundables]
  );

  const purchasedItemSlugsByCategory = useMemo(() => {
    const m = new Map<string, string[]>();
    for (const r of refundables) {
      const arr = m.get(r.categoryId) ?? [];
      if (!arr.includes(r.careItemSlug)) arr.push(r.careItemSlug);
      m.set(r.categoryId, arr);
    }
    return m;
  }, [refundables]);

  const refundableByCategory = useMemo(() => {
    const m = new Map<string, RefundableLine[]>();
    refundables.forEach((r) => {
      const arr = m.get(r.categoryId) ?? [];
      arr.push(r);
      m.set(r.categoryId, arr);
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
  const [uploadWarning, setUploadWarning] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const handleSubmit = async () => {
    if (!activeClientId) {
      alert('Please select a client in the banner first.');
      return;
    }
    if (!receiptFile) {
      setUploadWarning('Please upload a receipt file before submitting!');
      return;
    }
    setUploadWarning(null);
    setSubmitting(true);
    const receiptUrl = receiptFile ? `/uploads/${receiptFile.name}` : undefined;

    const madeByIdToSend =
      carers.length > 0 && madeByUserId ? madeByUserId : madeByFallback.trim();
    if (!madeByIdToSend) {
      alert('Please select or enter the carer/user who made this transaction.');
      return;
    }

    if (transType === 'Purchase') {
      if (
        purchaseLines.some(
          (l) => !l.categoryId || !l.careItemSlug || !l.amount.trim()
        )
      ) {
        alert('Each purchase line needs Category, Care Item and Amount.');
        return;
      }
      const lines: PurchaseLineInput[] = purchaseLines.map((l) => {
        const normalizedSlug = (
          l.careItemSlug || slugify(l.label || '')
        ).toLowerCase();
        const fallbackLabel =
          l.label ||
          careItems.find(
            (ci) => ci.categoryId === l.categoryId && ci.slug === l.careItemSlug
          )?.label ||
          normalizedSlug;
        return {
          categoryId: l.categoryId,
          careItemSlug: normalizedSlug,
          label: fallbackLabel,
          amount: Number(l.amount),
        };
      });
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
      } finally {
        setSubmitting(false);
      }
      return;
    }

    // Refund branch
    const chosen = refundLines.filter(
      (r) =>
        r.categoryId && r.careItemSlug && r.occurrenceKey && r.amount.trim()
    );
    if (chosen.length === 0) {
      alert('Select at least one refund line with a valid amount.');
      return;
    }

    for (const r of chosen) {
      const [refundOfTransId, refundOfLineId] = r.occurrenceKey.split(':');
      const occ = refundables.find(
        (o) =>
          o.purchaseTransId === refundOfTransId && o.lineId === refundOfLineId
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
        return { refundOfTransId, refundOfLineId, amount: Number(r.amount) };
      }),
    };

    try {
      await addTransactionFE(activeClientId, refundPayload);
      router.push('/calendar_dashboard/transaction_history');
    } catch (e) {
      console.error(e);
      alert('Failed to add refund.');
    } finally {
      setSubmitting(false);
    }
  };

  const inputCls =
    'h-12 rounded-sm px-3 bg-white text-black outline-none border';
  const inputStyle = { borderColor: colors.inputBorder };

  return (
    <DashboardChrome
      page="transactions"
      clients={clients}
      onClientChange={onClientChange}
      colors={{ header: colors.header, banner: colors.banner, text: '#000' }}
    >
      {/* Main scroll area */}
      <div
        className="flex-1 h-[680px] bg-white/80 overflow-auto"
        aria-busy={loadAny}
      >
        {/* Section header */}
        <div className="w-full px-6 py-5">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <h2 className="text-[#3A0000] text-3xl font-semibold">
              Add Transaction
            </h2>
            <button
              onClick={() =>
                router.push('/calendar_dashboard/transaction_history')
              }
              className="flex items-center gap-2 text-lg font-semibold text-[#3A0000] bg-[#EAD8C8] hover:bg-[#DFC8B4] border border-[#D4B8A0] rounded-md px-4 py-2 transition"
            >
              <ArrowLeft size={22} strokeWidth={2.5} />
              Back
            </button>
          </div>

          {/* Divider (from main) */}
          <hr className="mt-4 mb-6 w-340 mx-auto border-t border-[#3A0000]/25 rounded-full" />
        </div>

        {uploadWarning && (
          <div className="mb-4 rounded-lg border border-red-400 bg-red-100 text-red-900 px-6 py-3 font-semibold">
            {uploadWarning}
          </div>
        )}

        {/* Form area */}
        <div className="w-full max-w-[900px] mx-auto px-6 py-8">
          {loadAny ? (
            <div
              className="text-center py-24 text-gray-600 text-xl font-medium"
              aria-busy="true"
            >
              Loading transaction form…
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6">
              {/* Type */}
              <div className="flex flex-col gap-2">
                <label
                  className="text-2xl font-extrabold"
                  style={{ color: colors.label }}
                >
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
                <label
                  className="text-2xl font-extrabold"
                  style={{ color: colors.label }}
                >
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
                <label
                  className="text-2xl font-extrabold"
                  style={{ color: colors.label }}
                >
                  Made By (Carer / Management)
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
                <label
                  className="text-2xl font-extrabold"
                  style={{ color: colors.label }}
                >
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
                <label
                  className="text-2xl font-extrabold"
                  style={{ color: colors.label }}
                >
                  Upload Receipt
                </label>
                <div className="flex items-center gap-4">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,.pdf"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files?.length)
                        setReceiptFile(e.target.files[0]);
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

              {/* Lines */}
              <div className="flex flex-col gap-6">
                {transType === 'Purchase' ? (
                  <>
                    <div
                      className="text-xl font-bold"
                      style={{ color: colors.label }}
                    >
                      Purchase Lines
                    </div>
                    {purchaseLines.map((l) => {
                      const itemsForCat = l.categoryId
                        ? (careItemsByCategoryId.get(l.categoryId) ?? [])
                        : [];
                      return (
                        <div
                          key={l.id}
                          className="rounded-xl border p-4 bg-white flex flex-col gap-4"
                        >
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
                                const found = itemsForCat.find(
                                  (ci) => ci.slug === slug
                                );
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
                              {itemsForCat
                                .filter((ci) => ci && (ci.slug || ci.id))
                                .map((ci, idx) => {
                                  const key =
                                    ci.slug ?? ci.id ?? `fallback-${idx}`;
                                  return (
                                    <option
                                      key={key}
                                      value={ci.slug ?? ''}
                                      disabled={!ci.slug}
                                    >
                                      {ci.label}
                                    </option>
                                  );
                                })}
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
                              onChange={(e) =>
                                updatePurchaseLine(l.id, {
                                  amount: e.target.value,
                                })
                              }
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
                    <div
                      className="text-xl font-bold"
                      style={{ color: colors.label }}
                    >
                      Refund Lines
                    </div>

                    {refundLines.map((l) => {
                      const itemOptions = l.categoryId
                        ? (purchasedItemSlugsByCategory.get(l.categoryId) ?? [])
                        : [];
                      const occurrences =
                        l.categoryId && l.careItemSlug
                          ? (occurrencesByCatAndItem.get(
                              `${l.categoryId}:${l.careItemSlug}`
                            ) ?? [])
                          : [];
                      const selectedOcc = occurrences.find(
                        (o) =>
                          `${o.purchaseTransId}:${o.lineId}` === l.occurrenceKey
                      );

                      return (
                        <div
                          key={l.id}
                          className="rounded-xl border p-4 bg-white flex flex-col gap-4"
                        >
                          {/* Category (only those with refundable lines) */}
                          <div className="flex flex-col gap-2">
                            <label className="font-semibold">
                              Category (refundable)
                            </label>
                            <select
                              value={l.categoryId}
                              onChange={(e) =>
                                updateRefundLine(l.id, {
                                  categoryId: e.target.value,
                                  careItemSlug: '',
                                  occurrenceKey: '',
                                })
                              }
                              className={`${inputCls} w-[360px]`}
                              style={inputStyle}
                            >
                              <option value="">Select a category</option>
                              {purchasedCatIds.map((id) => (
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
                              onChange={(e) =>
                                updateRefundLine(l.id, {
                                  careItemSlug: e.target.value,
                                  occurrenceKey: '',
                                })
                              }
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
                            <label className="font-semibold">
                              Purchase occurrence
                            </label>
                            <select
                              value={l.occurrenceKey}
                              onChange={(e) =>
                                updateRefundLine(l.id, {
                                  occurrenceKey: e.target.value,
                                })
                              }
                              disabled={!l.categoryId || !l.careItemSlug}
                              className={`${inputCls} w-[480px]`}
                              style={inputStyle}
                            >
                              <option value="">
                                Select purchase occurrence
                              </option>
                              {occurrences.map((o) => (
                                <option
                                  key={`${o.purchaseTransId}:${o.lineId}`}
                                  value={`${o.purchaseTransId}:${o.lineId}`}
                                >
                                  {o.purchaseDate} • orig $
                                  {o.originalAmount.toFixed(2)} • rem $
                                  {o.remainingRefundable.toFixed(2)}
                                </option>
                              ))}
                            </select>
                            {selectedOcc &&
                              l.amount &&
                              Number(l.amount) > 0 && (
                                <div className="text-sm text-gray-700">
                                  Remaining available: $
                                  {selectedOcc.remainingRefundable.toFixed(2)}
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
                              onChange={(e) =>
                                updateRefundLine(l.id, {
                                  amount: e.target.value,
                                })
                              }
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
                              className="px-3 py-2 rounded-md border hover:bg:black/5"
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
                  className="px-5 py-2.5 rounded-md text-lg font-medium text-[#3A0000] bg-[#F3E9DF] border border-[#D8C6B9] hover:bg-[#E9DED2] transition"
                  onClick={() =>
                    router.push('/calendar_dashboard/transaction_history')
                  }
                >
                  Cancel
                </button>
                <button
                  disabled={submitting || !receiptFile}
                  className={`px-5 py-2.5 rounded-md text-lg font-medium text-white transition ${
                    submitting || !receiptFile
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-[#3A0000] hover:bg-[#502121]'
                  }`}
                  onClick={handleSubmit}
                >
                  {submitting ? 'Saving…' : 'Add'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardChrome>
  );
}
