/**
 * View Transactions
 * Frontend Authors: Devni Wijesinghe & Qingyue Zhao
 *
 * Last Updated by Denise Alexander (16/10/2025): Fixed active client usage, client dropdown
 * now works correctly.
 */

'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import DashboardChrome from '@/components/top_menu/client_schedule';
import { getAvailableYears } from '@/lib/budget-helpers';


import {
  getViewerRole,
  getClients,
  getActiveClient,
  setActiveClient,
  type Client as ApiClient,
} from '@/lib/data';

import { getTransactionsFE } from '@/lib/transaction-helpers';

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
  const [loading, setLoading] = useState({clients: true, years: true, rows: true});
  const [errorText, setErrorText] = useState('');
  
  const loadingAny = loading.clients || loading.years || loading.rows;
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
      setLoading(s => ({...s, clients: true}));
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
        setLoading(s => ({...s, clients: false}));
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

  /** Year selection */
  const [years, setYears] = useState<number[]>([2025]);
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [todayDate, setTodaysDate] = useState<string>();

  useEffect(() => {
      const d = new Date();
      const fmt = new Intl.DateTimeFormat('en-AU', {dateStyle: 'long', timeZone:'Australia/Melbourne'});
      setTodaysDate(fmt.format(d));
    }, []);
  
  useEffect(() => {
    let abort = new AbortController();
    const load = async () => {
      if(!activeClientId) {
        setYears([]);
        setLoading(s => ({...s, years: false}));
        return;
      }
      setLoading(s => ({...s, years: true}));
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
      } finally {
        setLoading(s => ({...s, years: false}));
      }
    };
    load();
    return () => abort.abort();
  }, [activeClientId]);

  useEffect(() => {
  if (!activeClientId) { setRows([]); return; }
  (async () => {
    setLoading(s => ({...s, rows: true}));
    setErrorText('');
    try {
      const data = await getTransactionsFE(activeClientId, year);
      setRows(Array.isArray(data) ? data : []);
    } catch {
      setErrorText('Failed to load transactions for this client.');
      setRows([]);
    } finally {
      setLoading(s => ({...s, rows: false}));
    }
  })();
}, [activeClientId, year])

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
      <div className="flex-1 h-[680px] bg-white/80 overflow-auto" aria-busy>
        {/* Header bar */}
        <div
          className="w-full flex items-center justify-between px-6 py-5"
          style={{ backgroundColor: colors.header }}
        >
          {/* Left side: Title */}
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold text-white">Transaction History</h1>
            <span className="text-white/90 font-bold text-sm">View year:</span>
            <select
              value={String(year)}
              onChange={(e) => setYear(Number(e.target.value))}
              className="rounded bg-white text-black px-2 py-1 text-sm"
              aria-label="Select year to view transactions"
              title="View transaction history of year"
              disabled={loadingAny}
            >
              {years.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>

          {/* Right side: Add button + Search bar */}
          <div className="flex items-center gap-7">
            {role === 'carer' && (
              <button
                className="px-4 py-2 rounded-md font-semibold text-black"
                style={{ backgroundColor: '#FFA94D' }}
                onClick={() =>
                  router.push(
                    '/calendar_dashboard/budget_report/add_transaction'
                  )
                }
              >
                Add new transaction
              </button>
              
            )}
            <div className="flex items-center gap-2 bg-white rounded-lg px-3 py-2">
              <input
                type="text"
                placeholder="Search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="border-none focus:outline-none w-56 text-black text-sm"
                disabled={loadingAny}
              />
            </div>
          </div>
        </div>

        {/* Table full width */}
        <div className="w-full overflow-auto">
          {loadingAny ? (
            <div className="p-6 text-gray-600">Loading transactions…</div>
          ) : errorText ? (
            <div className="p-6 text-red-600">{errorText}</div>
          ) : (
            <table className="w-full border-collapse text-sm text-black">
              <thead className="sticky top-0 bg-[#F9C9B1] shadow-sm">
                <tr className="text-left">
                  <th className="p-5">Type</th>
                  <th className="p-5">Date</th>
                  <th className="p-5">Made By</th>
                  <th className="p-5">Receipt</th>
                  <th className="p-5">Associated Care Items</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length > 0 ? (
                  filtered.map((t) => (
                    <tr
                      key={t.id}
                      className="border-b hover:bg-[#fff6ea] transition"
                    >
                      <td className="p-5 font-semibold">{t.type}</td>
                      <td className="p-5">{t.date}</td>
                      <td className="p-5">{t.madeBy}</td>
                      <td className="p-5">{t.receipt}</td>
                      <td className="p-5">
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
                    <td colSpan={5} className="p-8 text-center text-gray-500">
                      No transactions for this client.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </DashboardChrome>
  );
}
