/**
 * View Transactions
 * Front-end Authors: Devni Wijesinghe & Qingyue Zhao
 * Back-end Author: Zahra Rizqita
 *
 * Updated by Denise Alexander (16/10/2025): Fixed active client usage, client dropdown
 * now works correctly.
 *
 * Last Updated by Denise Alexander (20/10/2025): UI design and layout changes for readability,
 * consistency and better navigation.
 */

'use client';

import { Search } from 'lucide-react';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import DashboardChrome from '@/components/top_menu/client_schedule';

import {
  getViewerRole,
  getClients,
  getActiveClient,
  setActiveClient,
  type Client as ApiClient,
} from '@/lib/data';

import { getTransactionsFE } from '@/lib/mock/mockApi';

// --------- Type Definitions ---------
type Role = 'carer' | 'family' | 'management';

/** Data shape returned by getTransactionsFE() */
type ApiTransaction = {
  id: string;
  clientId: string;
  type: string;
  date: string;
  madeBy: string;
  items: string[];
  receipt: string;
};

type ClientLite = {
  id: string;
  name: string;
  orgAccess?: 'approved' | 'pending' | 'revoked';
};

type ApiClientWithAccess = ApiClient & {
  orgAccess?: 'approved' | 'pending' | 'revoked';
};

const colors = {
  header: '#3A0000',
  banner: '#F9C9B1',
  text: '#000000',
};

export default function TransactionHistoryPage() {
  return (
    <Suspense
      fallback={<div className="p-6 text-gray-600">Loading transactions…</div>}
    >
      <TransactionHistoryInner />
    </Suspense>
  );
}

function TransactionHistoryInner() {
  const router = useRouter();

  // Transactions
  const [rows, setRows] = useState<ApiTransaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorText, setErrorText] = useState('');

  // Filters
  const [search, setSearch] = useState<string>('');

  /* ------------------------------ Role ------------------------------ */
  const [role, setRole] = useState<Role>('carer'); // default

  useEffect(() => {
    (async () => {
      try {
        const r = await getViewerRole();
        setRole(r);
      } catch (err) {
        console.error('Failed to get role.', err);
        setRole('carer'); // fallback
      }
    })();
  }, []);

  /* ---------------------------- Clients ----------------------------- */
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

  // Change active client (persists with helper)
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

  /** Load transactions when active client changes */
  useEffect(() => {
    if (!activeClientId) {
      setRows([]);
      return;
    }
    (async () => {
      setLoading(true);
      setErrorText('');
      try {
        const data = await getTransactionsFE(activeClientId);
        setRows(Array.isArray(data) ? data : []);
      } catch {
        setErrorText('Failed to load transactions for this client.');
        setRows([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [activeClientId]);

  /** Filter */
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((t) =>
      [t.type, t.date, t.madeBy, t.receipt, ...t.items]
        .join(' ')
        .toLowerCase()
        .includes(q)
    );
  }, [rows, search]);

  return (
    <DashboardChrome
      page="transactions"
      clients={clients}
      onClientChange={onClientChange}
      colors={colors}
    >
      {/* Main content */}
      <div className="flex-1 h-[680px] bg-white/80 overflow-auto">
        <div className="w-full px-6 py-5">
          {/* Top bar: title + search + add */}
          <div className="flex items-center justify-between flex-wrap gap-4">
            {/* LEFT: Title */}
            <h1 className="text-[#3A0000] text-3xl font-semibold">
              Transaction History
            </h1>

            {/* RIGHT: Search + Add button */}
            <div className="flex items-center gap-5">
              <div className="relative">
                <Search
                  size={20}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-black/60 pointer-events-none"
                />
                <input
                  type="text"
                  placeholder="Search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="h-9 rounded-full bg-white text-black border px-10"
                />
              </div>

              {role === 'carer' && (
                <button
                  className="px-4 py-2 rounded-md font-semibold text-[#3A0000] hover:opacity-90 transition"
                  style={{
                    background:
                      'linear-gradient(90deg, #F9C9B1 0%, #FBE8D4 100%)',
                    border: '1px solid #B47A64',
                    boxShadow: '0 2px 6px rgba(180, 122, 100, 0.25)',
                  }}
                  onClick={() =>
                    router.push(
                      '/calendar_dashboard/budget_report/add_transaction'
                    )
                  }
                >
                  Add new transaction
                </button>
              )}
            </div>
          </div>

          {/* Divider */}
          <hr className="mt-4 mb-6 w-340 mx-auto border-t border-[#3A0000]/25 rounded-full" />

          {/* Table container */}
          <div className="w-full pt-2 pb-6">
            <div className="rounded-2xl border border-[#3A0000]/30 bg-white overflow-hidden shadow-sm">
              {loading ? (
                <div className="p-6 text-gray-600">Loading transactions…</div>
              ) : errorText ? (
                <div className="p-6 text-red-600">{errorText}</div>
              ) : (
                <table className="w-full text-left text-sm bg-white">
                  <thead
                    className="text-[#3A0000] text-lg font-semibold"
                    style={{
                      backgroundColor: '#FBE8D4',
                      borderBottom: '2px solid rgba(58, 0, 0, 0.15)',
                    }}
                  >
                    <tr className="text-left">
                      <th className="px-6 py-4">Type</th>
                      <th className="px-6 py-4">Date</th>
                      <th className="px-6 py-4">Made By</th>
                      <th className="px-6 py-4">Receipt</th>
                      <th className="px-6 py-4">Associated Care Items</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.length > 0 ? (
                      filtered.map((t) => (
                        <tr
                          key={t.id}
                          className="border-b last:border-b border-[#3A0000]/20 hover:bg-[#fff6ea] transition"
                        >
                          <td className="px-6 py-5 font-semibold">{t.type}</td>
                          <td className="px-6 py-5">{t.date}</td>
                          <td className="px-6 py-5">{t.madeBy}</td>
                          <td className="px-6 py-5">{t.receipt}</td>
                          <td className="px-6 py-5">
                            <div className="flex flex-col gap-1">
                              {t.items.map((i, idx) => (
                                <div
                                  key={idx}
                                  className="flex items-center justify-between gap-2"
                                >
                                  <span>{i}</span>
                                  {role === 'carer' && (
                                    <button
                                      className="px-2 py-1 text-xs bg-[#3d0000] text-white rounded"
                                      onClick={() =>
                                        router.push('/calendar_dashboard')
                                      }
                                    >
                                      View Care Item
                                    </button>
                                  )}
                                </div>
                              ))}
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan={5}
                          className="p-8 text-center text-gray-500"
                        >
                          No transactions for this client.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardChrome>
  );
}
