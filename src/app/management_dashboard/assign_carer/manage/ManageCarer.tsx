'use client';

export const dynamic = 'force-dynamic';

import React, { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';

type Carer = { id: string; name: string };
type Client = { id: string; name: string };

// ---------- localStorage helpers ----------
function loadJSON<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}
function saveJSON<T>(key: string, value: T) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(key, JSON.stringify(value));
}

function loadCarers(): Carer[] {
  return loadJSON<Carer[]>('carers', []);
}
function loadCarerAccess(): Record<string, string[]> {
  return loadJSON<Record<string, string[]>>('carerAccess', {});
}

// ---------- mock database ----------
const hardcodedClients: Client[] = [
  { id: 'c1', name: 'Jane Smith' },
  { id: 'c2', name: 'Harry Dong' },
  { id: 'c3', name: 'Jose Lin' },
  { id: 'c4', name: 'Kevin Wu' },
  { id: 'c5', name: 'Mickey Mouse' },
];

export default function AssignCarerPage() {
  const router = useRouter();
  const params = useSearchParams();
  const carerId = params.get('carer') ?? '';

  const [mounted, setMounted] = useState(false);
  const [carers, setCarers] = useState<Carer[]>([]);
  const [accessMap, setAccessMap] = useState<Record<string, string[]>>({});

  // search & select (multiple selection)
  const [query, setQuery] = useState('');
  const [hasSearched, setHasSearched] = useState(false); // whether to show dropdown
  const [selectedClients, setSelectedClients] = useState<Client[]>([]);

  useEffect(() => {
    setCarers(loadCarers());
    setAccessMap(loadCarerAccess());
    setMounted(true);
  }, []);

  const assignedClientIds = accessMap[carerId] ?? [];

  const carerName = useMemo(
    () => carers.find((c) => c.id === carerId)?.name ?? 'Selected carer',
    [carers, carerId]
  );

  const assignedClients = useMemo(
    () => hardcodedClients.filter((cl) => assignedClientIds.includes(cl.id)),
    [assignedClientIds]
  );

  const unassignedClients = useMemo(
    () => hardcodedClients.filter((cl) => !assignedClientIds.includes(cl.id)),
    [assignedClientIds]
  );

  // show dropdown only if hasSearched is true
  const searchResults = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!hasSearched || !q) return [];
    return unassignedClients.filter(
      (c) =>
        c.name.toLowerCase().includes(q) &&
        !selectedClients.some((s) => s.id === c.id)
    );
  }, [hasSearched, query, unassignedClients, selectedClients]);

  const resultsOpen = hasSearched;

  const triggerSearch = () => {
    if (!query.trim()) {
      setHasSearched(false);
      return;
    }
    setHasSearched(true);
  };

  const onPickClient = (client: Client) => {
    setSelectedClients((prev) =>
      prev.some((p) => p.id === client.id) ? prev : [...prev, client]
    );
    setQuery('');
    setHasSearched(false);
  };

  const onRemoveSelected = (id: string) => {
    setSelectedClients((prev) => prev.filter((c) => c.id !== id));
  };

  const onAssign = () => {
    if (selectedClients.length === 0) return;
    const next = { ...accessMap };
    const current = next[carerId] ?? [];
    const newIds = selectedClients
      .map((c) => c.id)
      .filter((id) => !current.includes(id));
    if (newIds.length > 0) {
      next[carerId] = [...current, ...newIds];
      setAccessMap(next);
      saveJSON('carerAccess', next);
    }
    setSelectedClients([]);
    setQuery('');
    setHasSearched(false);
  };

  const onRevoke = (clientId: string) => {
    const next = { ...accessMap };
    next[carerId] = (next[carerId] ?? []).filter((id) => id !== clientId);
    setAccessMap(next);
    saveJSON('carerAccess', next);
  };

  if (!mounted) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-[#F5CBA7] p-6">
        <div className="w-full max-w-2xl rounded-[22px] border border-[#6b3f2a] bg-[#F7ECD9] shadow">
          <div className="w-full px-8 py-4 bg-[#3A0000] text-white text-center rounded-t-[22px]">
            <h1 className="text-3xl font-extrabold">Assign Carer Access</h1>
          </div>
          <div className="p-8 text-[#1c130f]">Loading…</div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-[#F5CBA7] p-6">
      <Image
        src="/logo-name.png"
        alt="Scheduling of Care"
        width={220}
        height={55}
        priority
        className="fixed top-6 left-8"
      />

      <div className="w-full max-w-2xl rounded-[22px] border border-[#6b3f2a] bg-[#F7ECD9] shadow">
        {/* header */}
        <div className="w-full px-8 py-4 bg-[#3A0000] text-white text-center rounded-t-[22px]">
          <h1 className="text-3xl font-extrabold">Manage Carer Access</h1>
        </div>

        <div className="p-8 space-y-8 text-[#1c130f]">
          {/* selected carer */}
          <div className="text-2xl">
            <span className="font-extrabold">Selected Carer: </span>
            <span className="font-medium">{carerName}</span>
          </div>

          {/* current access list */}
          {assignedClients.length > 0 ? (
            <div className="space-y-3">
              <div className="text-lg font-semibold">
                This carer currently has access to:
              </div>
              <ul className="space-y-3">
                {assignedClients.map((cl) => (
                  <li
                    key={cl.id}
                    className="w-full flex items-center justify-between rounded-xl border border-[#7c5040]/30 bg-white px-4 py-3"
                  >
                    <span className="text-lg">
                      <span className="font-semibold mr-2">Client Name:</span>
                      {cl.name}
                    </span>
                    <button
                      onClick={() => onRevoke(cl.id)}
                      className="rounded-full bg-[#8B0000] hover:bg-[#a40f0f] text-white text-sm font-semibold px-4 py-1.5 shadow"
                    >
                      Revoke
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="text-lg">
              This carer currently has no access to any client.
            </div>
          )}

          {/* search + dropdown */}
          <div className="space-y-2">
            <div className="text-lg font-semibold">
              Select clients to assign this carer to:
            </div>

            <div className="flex items-start gap-3 w-full">
              <div className="flex-1">
                <div className="border border-[#7c5040]/40 rounded-xl overflow-hidden bg-white w-full">
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && triggerSearch()}
                    placeholder="Search clients..."
                    className="w-full px-3 py-2 text-lg outline-none"
                    aria-label="Search clients"
                  />
                </div>

                {resultsOpen && (
                  <div
                    className="border border-t-0 border-[#7c5040]/40 rounded-b-xl bg-white w-full max-h-56 overflow-auto"
                    role="listbox"
                    aria-label="Search results"
                  >
                    {searchResults.length === 0 ? (
                      <div className="px-4 py-3 text-[#555]">
                        No clients found.
                      </div>
                    ) : (
                      searchResults.map((cl) => (
                        <button
                          key={cl.id}
                          onClick={() => onPickClient(cl)}
                          className="w-full text-left px-4 py-3 hover:bg-gray-100"
                          role="option"
                          aria-selected="false"
                        >
                          {cl.name}
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>

              <button
                onClick={triggerSearch}
                className="rounded-full bg-[#F39C6B] hover:bg-[#ef8a50] text-[#1c130f] font-extrabold px-5 py-2 shadow"
              >
                Search
              </button>
            </div>
          </div>

          {/* selected clients bar */}
          {selectedClients.length > 0 && (
            <div className="w-full flex items-center justify-between rounded-xl border border-[#7c5040]/30 bg-white px-4 py-3">
              <div className="text-lg flex-1">
                <span className="font-semibold mr-2">Selected Client:</span>
                <span className="inline-flex flex-wrap gap-x-3 gap-y-1 align-middle">
                  {selectedClients.map((c) => (
                    <span key={c.id} className="inline-flex items-center">
                      {c.name}
                      <button
                        onClick={() => onRemoveSelected(c.id)}
                        className="ml-2 text-[#7c5040] hover:text-black text-sm"
                        aria-label={`remove ${c.name}`}
                        title="Remove"
                      >
                        ✕
                      </button>
                    </span>
                  ))}
                </span>
              </div>
              <button
                onClick={onAssign}
                className="ml-4 rounded-full bg-[#006400] hover:bg-[#0a7a0a] text-white text-sm font-semibold px-4 py-1.5 shadow shrink-0"
              >
                Assign
              </button>
            </div>
          )}

          {/* important notice */}
          <div className="px-6 py-5 bg-rose-300/25 border border-rose-300/50 rounded-lg">
            <span className="font-bold mr-1">IMPORTANT:</span>
            Assigning this carer to a client grants the carer access to that
            client’s profile and related information. Revoking the assignment
            removes this access immediately.
          </div>

          {/* footer buttons */}
          <div className="flex items-center justify-end gap-3">
            <button
              onClick={() => router.push('/carer/search')}
              className="text-xl font-medium hover:opacity-80"
            >
              Cancel
            </button>
            <button
              onClick={() => router.push('/carer/search')}
              className="rounded-full bg-[#F39C6B] hover:bg-[#ef8a50] text-xl font-extrabold px-8 py-2 shadow text-[#1c130f]"
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
