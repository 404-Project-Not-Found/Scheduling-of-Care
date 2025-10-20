/*
 * File path: /calendar_dashboard/add_transaction/page.tsx
 * Frontend Author: Devni Wijesinghe (refactor to use DashboardChrome by QY)
 * Backend Author: Zahra Rizqita
 */

'use client';

import React, { useEffect, useMemo, useRef, useState, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import DashboardChrome from '@/components/top_menu/client_schedule';
import { useTransactions } from '@/context/TransactionContext';

import {
  getViewerRole,
  getClients,
  getActiveClient,
  setActiveClient,
  type Client as ApiClient,
} from '@/lib/data';

import { 
  addTransactionFE,
  type CreatePurchaseBody,
  type CreateRefundBody,
  type PurchaseLineInput
} from '@/lib/transaction-helpers';

import {
  getBudgetCategories,
  getBudgetRows,
  type CategoryLite,
  type BudgetRow
} from '@/lib/budget-helpers';

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

export default function AddTransactionPage() {
  return (
    <Suspense fallback={<div className="p-6 text-gray-600">Loading…</div>}>
      <AddTransactionInner />
    </Suspense>
  );
}

function AddTransactionInner() {
  const router = useRouter();
  const { addTransaction } = useTransactions();

  /* ---------- Top bar client dropdown ---------- */
  const [clients, setClients] = useState<{ id: string; name: string }[]>([]);
  const [activeClientId, setActiveClientId] = useState<string | null>(null);
  const [activeClientName, setActiveClientName] = useState<string>('');
  const [year, setYear] = useState<number>(2025);

  useEffect(() => {
    (async () => {
      try {
        const list = await getClients();
        const mapped = (list as ApiClient[]).map((c) => ({ id: c._id, name: c.name }));
        setClients(mapped);

        const active = await getActiveClient();
        const useId = active.id || mapped[0]?.id || null;
        const useName = active.name || (mapped.find((m) => m.id === useId)?.name ?? '');
        setActiveClientId(useId);
        setActiveClientName(useName);
      } catch {
        setClients([]);
      }
    })();
  }, []);

  const onClientChange = async (id: string) => {
    const c = clients.find((x) => x.id === id) || null;
    const name = c?.name || '';
    setActiveClientId(id || null);
    setActiveClientName(name);
    await setActiveClient(id || '', name);
  };

  /* ---------- Care Item Catalog + Tasks ---------- */
  const [categories, setCategories] = useState<CategoryLite[]>([]);
  const [budgetRows, setBudgetRows] = useState<BudgetRow[]>([]);
  useEffect(() => {
    let abort = new AbortController();
    (async () => {
      if (!activeClientId) { setCategories([]); setBudgetRows([]); return; }
      try {
        const [cats, rows] = await Promise.all([
          getBudgetCategories(activeClientId, year, abort.signal),
          getBudgetRows(activeClientId, year, abort.signal),
        ]);
        setCategories(cats);
        setBudgetRows(rows);
      } catch {
        setCategories([]);
        setBudgetRows([]);
      }
    })();
    return () => abort.abort();
  }, [activeClientId, year]);

  const careItemOptionsByCat = useMemo(() => {
    const m = new Map<string, string[]>();
    budgetRows.forEach((r) => {
      const key = r.category.toLowerCase();
      m.set(key, [...(m.get(key) ?? []), r.item])
    });
    return m;
  }, [budgetRows]);

  /* ---------- Form state ---------- */
  type transKind = 'Purchase' | 'Refund';
  const [transType, setTransType] = useState<transKind>('Purchase');
  const[date, setDate] = useState('');
  const [madeByUserId, setMadeByUserId] = useState('demo-user-id'); // which carer
  const [note, setNote] = useState('');
  const [receiptFile, setReceiptFile] = useState<File | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  type Line = {
    id: string;
    categoryId: string;
    categoryName: string;
    careItemSlug: string;
    label: string;
    amount: string;
  };

  const [lines, setLines] = useState<Line[]>([
    { id: 'l1', categoryId: '', categoryName: '', careItemSlug: '', label: '', amount: '' },
  ]);

  const addLine = () =>
    setLines((prev) => [
      ...prev,
      { id: `l${Date.now()}`, categoryId: '', categoryName: '', careItemSlug: '', label: '', amount: '' },
    ]);

  const removeLine = (id: string) =>
    setLines((prev) => (prev.length > 1 ? prev.filter((l) => l.id !== id) : prev));

  const updateLine = (id: string, patch: Partial<Line>) =>
    setLines((prev) => prev.map((l) => (l.id === id ? { ...l, ...patch } : l)));

  const slugify = (s: string) =>
    s.toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-');

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
    if (lines.some((l) => !l.categoryId || !l.label || !l.amount)) {
      alert('Each line needs a Category, Care Item and Amount.');
      return;
    }

    const receiptUrl = receiptFile ? `/uploads/${receiptFile.name}` : undefined;

    if (transType === 'Purchase') {
      const payload: CreatePurchaseBody = {
        type: 'Purchase',
        date, // YYYY-MM-DD
        madeByUserId,
        receiptUrl,
        note,
        lines: lines.map<PurchaseLineInput>((l) => ({
          categoryId: l.categoryId,
          careItemSlug: l.careItemSlug || slugify(l.label),
          label: l.label,
          amount: Number(l.amount),
        })),
      };
      try {
        await addTransactionFE(activeClientId, payload);
        router.push('/calendar_dashboard/transaction_history');
      } catch (e) {
        console.error(e);
        alert('Failed to add transaction.');
      }
    } else {
      alert('Refund UI not implemented in this form. Switch Type to Purchase.');
    }
  };

  const inputCls =
    'h-12 w-[600px] rounded-sm px-3 bg-white text-black outline-none border';
  const inputStyle = { borderColor: colors.inputBorder };

  return (
    <DashboardChrome
      page="transactions"
      clients={clients}
      activeClientId={activeClientId}
      onClientChange={onClientChange}
      activeClientName={activeClientName}
      colors={{ header: colors.header, banner: colors.banner, text: '#000' }}
    >
      <div
        className="flex-1 h-[680px] overflow-auto"
        style={{ backgroundColor: colors.pageBg }}
      >
        {/* Section bar */}
        <div
          className="w-full flex items-center justify-between px-8 py-4 text-white text-3xl font-extrabold"
          style={{ backgroundColor: colors.sectionBar }}
        >
          <span>Add Transaction</span>
          <button
            onClick={() =>
              router.push('/calendar_dashboard/transaction_history')
            }
            className="text-lg font-semibold text-white hover:underline"
          >
            &lt; Back
          </button>
        </div>

        {/* Form area */}
        <div className="w-full max-w-[1120px] mx-auto px-25 py-15">
          <div className="grid grid-cols-[280px_1fr] gap-y-8 gap-x-10">
            {/* Category */}
            <label
              className="self-center text-2xl font-extrabold"
              style={{ color: colors.label }}
            >
              Care Item Category
            </label>
            <select
              value={category}
              onChange={(e) => {
                setCategory(e.target.value);
                setTaskName('');
              }}
              className={`${inputCls} appearance-none`}
              style={inputStyle}
            >
              <option value="">- Select a category -</option>
              {catalog.map((c) => (
                <option key={c.category} value={c.category}>
                  {c.category}
                </option>
              ))}
            </select>

            {/* Care Item Sub Category */}
            <label
              className="self-center text-2xl font-extrabold"
              style={{ color: colors.label }}
            >
              Care Item Sub Category
            </label>
            <select
              value={taskName}
              onChange={(e) => setTaskName(e.target.value)}
              disabled={!activeClientId || !category}
              className={`${inputCls} appearance-none`}
              style={inputStyle}
            >
              {!category ? (
                <option value="">- Select a category first -</option>
              ) : tasksForClientAndCategory.length === 0 ? (
                <option value="">No tasks available</option>
              ) : (
                <>
                  <option value="">Select a Care Item</option>
                  {tasksForClientAndCategory.map((t: ApiTask) => (
                    <option key={t.id} value={t.label}>
                      {t.label}
                    </option>
                  ))}
                </>
              )}
            </select>

            {/* Date */}
            <label
              className="self-center text-2xl font-extrabold"
              style={{ color: colors.label }}
            >
              Date
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className={inputCls}
              style={inputStyle}
            />

            {/* Carer Name */}
            <label
              className="self-center text-2xl font-extrabold"
              style={{ color: colors.label }}
            >
              Carer Name
            </label>
            <input
              type="text"
              value={carer}
              onChange={(e) => setCarer(e.target.value)}
              className={inputCls}
              style={inputStyle}
              placeholder="Enter carer name"
            />

            {/* Upload Receipt */}
            <label
              className="self-center text-2xl font-extrabold"
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

          {/* Footer buttons */}
          <div className="mt-14 flex items-center justify-center gap-40">
            <button
              className="px-8 py-3 rounded-2xl text-2xl font-extrabold"
              style={{ backgroundColor: colors.btnPill, color: '#1a1a1a' }}
              onClick={() =>
                router.push('/calendar_dashboard/transaction_history')
              }
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
    </DashboardChrome>
  );
}
