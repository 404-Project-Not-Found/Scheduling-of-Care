/**
 * File name: Request Log
 * File path: /request-log-page/page.tsx
 * Front-end Author: Devni Wijesinghe
 * Back-end Author: Denise Alexander
 *
 * - Uses <DashboardChrome /> to keep the same header + pink banner across the app.
 * - Loads the active client (from localStorage) and fetches that client's requests
 *   via getRequestsByClientFE(clientId). Switching the client in the pink banner
 *   reloads the table for the newly selected client.
 * - Management users can change the Status inline; the <select> is color-coded.
 * - The table section is flush to the white panel’s edges (no inner horizontal padding).
 *
 * Updated by Denise Alexander (16/10/2025): added back-end API endpoints.
 *
 * Last Updated by Denise Alexander (20/10/2025): UI design and layout changes for readability,
 * consistency and better navigation.
 */

'use client';

import { Plus, Search } from 'lucide-react';

import React, { useState, useEffect, Suspense, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import DashboardChrome from '@/components/top_menu/client_schedule';

import {
  getViewerRole,
  getClients,
  getActiveClient,
  setActiveClient,
  type Client as ApiClient,
} from '@/lib/data';

// --------- Type Definitions ---------
type Role = 'carer' | 'family' | 'management';

/** Data shape returned for back-end mode */
type ApiRequest = {
  id: string;
  clientId: string;
  task: string;
  change: string;
  requestedBy: string;
  dateRequested: string;
  status: 'Pending' | 'Implemented';
  resolutionDate: string;
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

/* ---------------------------- Page wrapper ---------------------------- */
export default function RequestLogPage() {
  return (
    <Suspense
      fallback={<div className="p-6 text-gray-600">Loading requests…</div>}
    >
      <RequestLogInner />
    </Suspense>
  );
}

/* ----------------------------- Utilities ----------------------------- */
const parseDateString = (dateStr: string) => {
  if (!dateStr || dateStr === '-') return new Date(0);
  const cleanStr = dateStr.replace(/(\d+)(st|nd|rd|th)/i, '$1');
  const d = new Date(cleanStr);
  return isNaN(d.getTime()) ? new Date(0) : d;
};

/** Utility for status color classes */
const statusClasses = (value: 'Pending' | 'Implemented') =>
  value === 'Pending'
    ? 'bg-yellow-100 text-yellow-800 border-yellow-300'
    : 'bg-green-100 text-green-800 border-green-300';

async function fetchRequestsByClient(clientId: string): Promise<ApiRequest[]> {
  const res = await fetch(`/api/v1/clients/${clientId}/requests`, {
    cache: 'no-store',
  });

  if (!res.ok) throw new Error(`Failed to fetch requests (${res.status})`);

  return (await res.json()) as ApiRequest[];
}

/* ------------------------------ Content ------------------------------ */
function RequestLogInner() {
  const router = useRouter();

  // Requests
  const [requests, setRequests] = useState<ApiRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorText, setErrorText] = useState<string>('');

  // Filters
  const [search, setSearch] = useState<string>('');
  const [sortKey, setSortKey] = useState<keyof ApiRequest | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

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

  /** Load requests when active client changes */
  useEffect(() => {
    if (!activeClientId) {
      setRequests([]);
      return;
    }
    (async () => {
      setLoading(true);
      setErrorText('');
      try {
        const data = await fetchRequestsByClient(activeClientId);
        setRequests(Array.isArray(data) ? data : []);
      } catch {
        setErrorText('Failed to load requests for this client.');
        setRequests([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [activeClientId]);

  /** Filter + sort */
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return requests;
    return requests.filter((r) =>
      [
        r.task,
        r.change,
        r.requestedBy,
        r.dateRequested,
        r.status,
        r.resolutionDate,
      ]
        .join(' ')
        .toLowerCase()
        .includes(q)
    );
  }, [requests, search]);

  const sorted = useMemo(() => {
    if (!sortKey) return filtered;
    const arr = [...filtered];
    arr.sort((a, b) => {
      let va: string | number;
      let vb: string | number;

      if (sortKey === 'dateRequested' || sortKey === 'resolutionDate') {
        va = parseDateString(a[sortKey]).getTime();
        vb = parseDateString(b[sortKey]).getTime();
      } else {
        va = String(a[sortKey]).toLowerCase();
        vb = String(b[sortKey]).toLowerCase();
      }
      if (va < vb) return sortDir === 'asc' ? -1 : 1;
      if (va > vb) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
    return arr;
  }, [filtered, sortKey, sortDir]);

  const toggleSort = (key: keyof ApiRequest) => {
    if (sortKey === key) setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  /** Inline status change (Management only) */
  const handleStatusChange = async (
    reqId: string,
    next: 'Pending' | 'Implemented'
  ) => {
    if (role !== 'management') return;

    if (!activeClientId) return;

    try {
      setRequests((prev) =>
        prev.map((r) =>
          r.id !== reqId
            ? r
            : {
                ...r,
                status: next,
                resolutionDate:
                  next === 'Implemented'
                    ? new Date().toLocaleDateString('en-GB', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })
                    : '-',
              }
        )
      );

      const res = await fetch(`/api/v1/clients/${activeClientId}/requests`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ requestId: reqId, status: next }),
      });

      if (!res.ok) {
        throw new Error('Failed to save request status.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <DashboardChrome
      page="request-log"
      clients={clients}
      onClientChange={onClientChange}
      colors={colors}
    >
      {/* Main content */}
      <div className="flex-1 h-[680px] bg-white/80 overflow-auto">
        {/* Header bar */}
        <div className="w-full px-6 py-5">
          <h1 className="text-[#3A0000] text-3xl font-semibold">Request Log</h1>

          {/* Divider */}
          <hr className="mt-4 mb-6 w-340 mx-auto border-t border-[#3A0000]/25 rounded-full" />

          {/* Search + Add button */}
          <div className="flex items-center justify-between flex-wrap gap-4 mt-2">
            {/* Search bar */}
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
                className="h-9 rounded-full bg-white text-black border px-10 shadow-sm"
              />
            </div>

            {/* Add request button */}
            {role === 'family' && (
              <button
                className="flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-black hover:opacity-90 transition"
                style={{
                  background:
                    'linear-gradient(90deg, #FFC87C 0%, #FFDDA3 100%)',
                  boxShadow: '0 2px 6px rgba(255, 168, 77, 0.4)',
                }}
                onClick={() =>
                  router.push('/family_dashboard/request_of_change_page')
                }
              >
                <Plus size={20} strokeWidth={2.5} />
                Add new request
              </button>
            )}
          </div>
        </div>

        {/* Table container */}
        <div className="w-full px-6 pt-3 pb-8">
          <div className="rounded-2xl border border-[#3A0000]/30 bg-white overflow-hidden shadow-sm">
            {loading ? (
              <div className="p-6 text-gray-600">Loading requests…</div>
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
                    <th
                      className="p-5 cursor-pointer"
                      onClick={() => toggleSort('task')}
                    >
                      Care Item{' '}
                      {sortKey === 'task'
                        ? sortDir === 'asc'
                          ? '⬆'
                          : '⬇'
                        : '⬍'}
                    </th>
                    <th className="p-5">Requested Change</th>
                    <th
                      className="p-5 cursor-pointer"
                      onClick={() => toggleSort('requestedBy')}
                    >
                      Requested By{' '}
                      {sortKey === 'requestedBy'
                        ? sortDir === 'asc'
                          ? '⬆'
                          : '⬇'
                        : '⬍'}
                    </th>
                    <th
                      className="p-5 cursor-pointer"
                      onClick={() => toggleSort('dateRequested')}
                    >
                      Date Requested{' '}
                      {sortKey === 'dateRequested'
                        ? sortDir === 'asc'
                          ? '⬆'
                          : '⬇'
                        : '⬍'}
                    </th>
                    <th
                      className="p-5 cursor-pointer"
                      onClick={() => toggleSort('status')}
                    >
                      Status{' '}
                      {sortKey === 'status'
                        ? sortDir === 'asc'
                          ? '⬆'
                          : '⬇'
                        : '⬍'}
                    </th>
                    <th className="p-5">Resolution Date</th>
                  </tr>
                </thead>

                <tbody>
                  {!activeClientId ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-gray-500">
                        Select a client to view requests.
                      </td>
                    </tr>
                  ) : sorted.length > 0 ? (
                    sorted.map((req) => (
                      <tr
                        key={req.id}
                        className="border-b hover:bg-[#fff6ea] transition"
                      >
                        <td className="p-5 font-semibold">{req.task}</td>
                        <td className="p-5">{req.change}</td>
                        <td className="p-5">{req.requestedBy}</td>
                        <td className="p-5">{req.dateRequested}</td>
                        <td className="p-5">
                          {role === 'management' ? (
                            <select
                              value={req.status}
                              onChange={(e) =>
                                handleStatusChange(
                                  req.id,
                                  e.target.value as 'Pending' | 'Implemented'
                                )
                              }
                              className={`rounded-full border px-3 py-1.5 text-xs font-bold ${statusClasses(
                                req.status
                              )}`}
                            >
                              <option value="Pending">Pending</option>
                              <option value="Implemented">Implemented</option>
                            </select>
                          ) : req.status === 'Pending' ? (
                            <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-xs font-bold">
                              Pending
                            </span>
                          ) : (
                            <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-bold">
                              Implemented
                            </span>
                          )}
                        </td>
                        <td className="p-5">{req.resolutionDate}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-gray-500">
                        No requests for this client.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </DashboardChrome>
  );
}
