/**
 * File path: src/app/family_dashboard/people_list/page.tsx
 * Frontend Author: Qingyue Zhao
 *
 * Features (family-only):
 * - Displays all clients (fetched from mockApi).
 * - For each client row:
 *    -> Avatar + Name
 *    -> Right-side buttons:
 *         - View profile
 *         - View dashboard (full / partial)
 *         - Manage organisation access
 * - No organisation access status shown (unlike management view).
 *
 * Last Updated by Denise Alexander - 7/10/2025: back-end integrated to fetch family
 * client lists from DB.
 */

'use client';

import { Plus, Search } from 'lucide-react';

import React, { Suspense, useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';

import DashboardChrome from '@/components/top_menu/client_schedule';
import * as data from '@/lib/data';
import { useActiveClient } from '@/context/ActiveClientContext';

type Client = {
  id: string;
  name: string;
  dashboardType?: 'full' | 'partial';
};

const colors = {
  pageBg: '#ffd9b3',
  cardBg: '#F7ECD9',
  banner: '#F9C9B1',
  header: '#3A0000',
  text: '#2b2b2b',
  help: '#ff9999',
};

export default function FamilyClientListPage() {
  return (
    <Suspense
      fallback={<div className="p-6 text-gray-600">Loading clients…</div>}
    >
      <FamilyClientListInner />
    </Suspense>
  );
}

function FamilyClientListInner() {
  const router = useRouter();
  const [clients, setClients] = useState<Client[]>([]);
  const [q, setQ] = useState('');
  const { client: activeClient, handleClientChange } = useActiveClient();
  const [loadingClientId, setLoadingClientId] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const list = await data.getClients();
        const mapped: Client[] = list.map((c) => ({
          id: c._id,
          name: c.name,
          dashboardType: c.dashboardType,
        }));
        setClients(mapped);
      } catch {
        setClients([]);
      }
    })();
  }, []);

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return clients;
    return clients.filter((c) => c.name.toLowerCase().includes(t));
  }, [clients, q]);

  const goToOrgAccess = async (c: Client) => {
    if (c && activeClient?.id !== c.id) {
      handleClientChange(c.id, c.name);
    }
    router.push(`/family_dashboard/manage_org_access/${c.id}`);
  };

  return (
    <DashboardChrome
      page="people-list"
      clients={clients}
      onClientChange={(id) => {
        const c = clients.find((cl) => cl.id === id);
        if (c) {
          goToOrgAccess(c);
        }
      }}
      colors={{
        header: colors.header,
        banner: colors.banner,
        text: colors.text,
      }}
    >
      <div className="w-full h-full" style={{ backgroundColor: colors.pageBg }}>
        <div className="max-w-[1380px] h-[680px] mx-auto px-6">
          {/* Section header */}
          <div
            className="w-full mt-6 rounded-t-xl px-6 py-4 text-white text-2xl md:text-3xl font-extrabold"
            style={{ backgroundColor: colors.header }}
          >
            My Client List
          </div>

          {/* Content */}
          <div
            className="w-full h-[calc(100%-3rem)] rounded-b-xl bg-[#f6efe2] border-x border-b flex flex-col"
            style={{ borderColor: '#3A000022' }}
          >
            {/* Search + add new */}
            <div className="flex items-center justify-between px-6 py-4 gap-4">
              <div className="relative flex-1 max-w-[350px]">
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Search for client"
                  className="w-full h-12 rounded-full bg-white border text-black px-10 focus:outline-none"
                  style={{ borderColor: '#3A0000' }}
                />
                <Search
                  size={20}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-black/60 pointer-events-none"
                />
              </div>
              <button
                onClick={() => router.push('/client_profile?new=true')}
                className="flex items-center gap-2 rounded-xl px-5 py-3 text-lg font-bold text-white hover:opacity-90"
                style={{ backgroundColor: colors.header }}
              >
                <Plus size={20} strokeWidth={2.5} />
                Add new Client
              </button>
            </div>

            {/* List */}
            <div className="flex-1 px-0 pb-6">
              <div
                className="mx-6 rounded-xl overflow-auto max-h-[500px]"
                style={{
                  backgroundColor: '#F2E5D2',
                  border: '1px solid rgba(58,0,0,0.25)',
                }}
              >
                {filtered.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-gray-600">
                    Loading clients...
                  </div>
                ) : (
                  <ul className="divide-y divide-[rgba(58,0,0,0.15)]">
                    {filtered.map((c) => (
                      <li
                        key={c.id}
                        className="flex items-center justify-between gap-5 px-6 py-6 hover:bg-[rgba(255,255,255,0.6)]"
                      >
                        {/* Left: avatar + name (clickable → dashboard) */}
                        <div
                          className="flex items-center gap-5 cursor-pointer"
                          onClick={() =>
                            router.push(
                              c.dashboardType === 'full'
                                ? `/calendar_dashboard?id=${c.id}`
                                : `/partial_dashboard?id=${c.id}`
                            )
                          }
                        >
                          <div
                            className="shrink-0 rounded-full flex items-center justify-center"
                            style={{
                              width: 64,
                              height: 64,
                              border: '1px solid #3A0000',
                              backgroundColor: '#fff',
                              color: '#3A0000',
                              fontWeight: 900,
                              fontSize: 20,
                            }}
                          >
                            {c.name.charAt(0).toUpperCase()}
                          </div>
                          <div
                            className="text-xl md:text-2xl font-semibold"
                            style={{ color: colors.text }}
                          >
                            {c.name}
                          </div>
                        </div>

                        {/* Right: action buttons */}
                        <div className="shrink-0 flex items-center gap-2">
                          {/* View profile */}
                          <button
                            onClick={async () => {
                              setLoadingClientId(c.id);
                              if (c && activeClient?.id !== c.id) {
                                handleClientChange(c.id, c.name);
                              }
                              router.push(`/client_profile?id=${c.id}`);
                            }}
                            className="px-4 py-2 rounded-lg text-white text-sm font-semibold hover:opacity-90"
                            style={{
                              background:
                                'linear-gradient(90deg, #F9C9B1 0%, #FAEBDC 100%)',
                              color: '#3A0000',
                              border: '1px solid #3A0000',
                              boxShadow: '0 1px 4px rgba(58, 0, 0, 0.2)',
                            }}
                            disabled={loadingClientId === c.id}
                          >
                            {loadingClientId === c.id
                              ? `Loading ${c.name}'s profile...`
                              : 'Edit profile'}
                          </button>

                          {/* Manage org access */}
                          <button
                            onClick={() => goToOrgAccess(c)}
                            className="px-4 py-2 rounded-lg text-white text-sm font-semibold hover:opacity-90"
                            style={{
                              background:
                                'linear-gradient(90deg, #803030 0%, #B44C4C 100%)',
                              color: '#FFFFFF',
                              border: '1px solid #5A1A1A',
                              boxShadow: '0 2px 6px rgba(58, 0, 0, 0.25)',
                            }}
                          >
                            Manage organisation access
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardChrome>
  );
}
