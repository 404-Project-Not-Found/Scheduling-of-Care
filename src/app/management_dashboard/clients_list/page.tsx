// src/app/client_list/page.tsx
'use client';

/**
 * File path: src/app/client_list/page.tsx
 * Frontend Author: Qingyue Zhao
 *
 * Purpose & features:
 * - Uses <DashboardChrome /> so the top header + pink banner stay consistent.
 * - Maroon section title bar: “Client List”.
 * - Right-side CTA button “Register new client” opens a RIGHT drawer panel
 *   (RegisterClientPanel) instead of navigating to a new page.
 * - Search box filters client names (case-insensitive).
 * - List shows avatar circle + name; clicking a row opens that client’s dashboard
 *   (full vs partial) and preserves your existing palette.
 */

import React, { Suspense, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

import DashboardChrome from '@/components/top_menu/client_schedule';
import RegisterClientPanel from '@/components/accesscode/registration'; // <-- your drawer panel
import { getClientsFE, type Client as ApiClient } from '@/lib/mockApi';

type Client = { id: string; name: string; dashboardType?: 'full' | 'partial' };

const colors = {
  pageBg: '#ffd9b3',
  cardBg: '#F7ECD9',
  banner: '#F9C9B1',
  header: '#3A0000',
  text: '#2b2b2b',
  help: '#ff9999',
};

export default function ClientListPage() {
  return (
    <Suspense fallback={<div className="p-6 text-gray-600">Loading clients…</div>}>
      <ClientListInner />
    </Suspense>
  );
}

function ClientListInner() {
  const router = useRouter();

  // ---- Data ----
  const [clients, setClients] = useState<Client[]>([]);
  const [q, setQ] = useState('');

  // ---- Drawer state (open/close the registration panel) ----
  const [showRegister, setShowRegister] = useState(false);
  const addNewClient = () => setShowRegister(true);

  useEffect(() => {
    (async () => {
      try {
        const list = await getClientsFE();
        const mapped: Client[] = list.map((c: ApiClient) => ({
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

  // ---- Filter ----
  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return clients;
    return clients.filter((c) => c.name.toLowerCase().includes(t));
  }, [clients, q]);

  // ---- Navigation ----
  const goDashboard = (c: Client) => {
    if (c.dashboardType === 'full') {
      router.push(`/calender_dashboard?id=${c.id}`);
    } else {
      router.push(`/partial_dashboard?id=${c.id}`);
    }
  };

  return (
    <DashboardChrome
      page="client-list"
      clients={[]} // not used on this page
      activeClientId={null}
      onClientChange={() => {}}
      activeClientName={undefined}
      colors={{ header: colors.header, banner: colors.banner, text: colors.text }}
      onLogoClick={() => router.push('/empty_dashboard')}
    >
      {/* Page body */}
      <div className="w-full h-full" style={{ backgroundColor: colors.pageBg }}>
        <div className="max-w-[1280px] h-[600px] mx-auto px-6">
          {/* Section title bar */}
          <div
            className="w-full mt-6 rounded-t-xl px-6 py-4 text-white text-2xl md:text-3xl font-extrabold"
            style={{ backgroundColor: colors.header }}
          >
            Client List
          </div>

          {/* Controls row + List area combined in the same card */}
          <div
            className="w-full h-[calc(100%-3rem)] rounded-b-xl bg-[#f6efe2] border-x border-b flex flex-col"
            style={{ borderColor: '#3A000022' }}
          >
            {/* Controls row */}
            <div className="flex items-center justify-between px-6 py-4 gap-4">
              {/* Search (left) */}
              <div className="relative flex-1 max-w-[400px]">
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Search for client"
                  className="w-full h-12 rounded-full bg-white border text-black px-12 focus:outline-none"
                  style={{ borderColor: '#3A0000' }}
                />
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-black/70">🔍</span>
              </div>

              {/* CTA (right) */}
              <button
                onClick={addNewClient}
                className="rounded-xl px-5 py-3 text-lg font-bold text-white hover:opacity-90"
                style={{ backgroundColor: colors.header }}
              >
                Register new client
              </button>
            </div>

            {/* List area */}
            <div className="flex-1 px-0 pb-6">
              <div
                className="mx-6 rounded-xl overflow-auto h-full"
                style={{
                  backgroundColor: '#F2E5D2', // warm beige list bg
                  border: '1px solid rgba(58,0,0,0.25)',
                }}
              >
                {filtered.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-gray-600">
                    No clients found.
                  </div>
                ) : (
                  <ul className="divide-y divide-[rgba(58,0,0,0.15)]">
                    {filtered.map((c) => (
                      <li
                        key={c.id}
                        className="flex items-center gap-5 px-6 py-6 cursor-pointer hover:bg-[rgba(255,255,255,0.6)]"
                        onClick={() => goDashboard(c)}
                      >
                        {/* Avatar circle */}
                        <div
                          className="shrink-0 rounded-full flex items-center justify-center"
                          style={{
                            width: 64,
                            height: 64,
                            border: '4px solid #3A0000',
                            backgroundColor: '#fff',
                            color: '#3A0000',
                            fontWeight: 900,
                            fontSize: 20,
                          }}
                          aria-hidden
                        >
                          {c.name.charAt(0).toUpperCase()}
                        </div>

                        {/* Name */}
                        <div
                          className="text-xl md:text-2xl font-semibold"
                          style={{ color: colors.text }}
                        >
                          {c.name}
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

      {/* Right-side registration drawer (stays mounted on this page) */}
      <RegisterClientPanel open={showRegister} onClose={() => setShowRegister(false)} />
    </DashboardChrome>
  );
}
