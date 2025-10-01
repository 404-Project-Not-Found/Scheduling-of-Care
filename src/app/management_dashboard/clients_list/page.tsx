
/**
 * Filename: /src/app/client_list/page.tsx
 * Frontend Author: Qingyue Zhao
 * 
 * Purpose:
 * - Display a list of clients for family and management
 *  1. family options: edit profile, view dashboard, manage organisation access
 *  2. management options: view profile, view dashboard
 * 
 *
 * Data:
 * - Source: getClientsFE() — mocked frontend API.
 * - Shape: Array<Client> where each item has at least {_id, name, dashboardType}.
 *
 * Navigation:
 * - Profile:   /client_profile?id=<clientId>
 * - Dashboard: /calender_dashboard?id=<clientId> (for dashboardType === 'full')
 *              /partial_dashboard?id=<clientId>  (otherwise)
 * - Register:  /management_dashboard/register_client?new=true
 * - Back:      /empty_dashboard
 *
 * Last Updated: 30/09/2025
 */

'use client';

export const dynamic = 'force-dynamic';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { getClientsFE, type Client } from '@/lib/mockApi';

// ----- Color palette -----
const palette = {
  pageBg: '#ffd9b3',
  cardBg: '#F7ECD9',
  header: '#3A0000',
  text: '#2b2b2b',
  border: '#3A0000',
  help: '#ff9999',
  white: '#ffffff',
  editGreen: '#4CAF50',
  dashOrange: '#FF9800',
  organPink: '#E91E63',
};

export default function ClientListPage() {
  const router = useRouter();
  const [clients, setClients] = useState<Client[]>([]);

  // Fetch list from mock data
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const list = await getClientsFE();
        if (mounted) setClients(Array.isArray(list) ? list : []);
      } catch (err) {
        console.error('Load clients failed:', err);
        if (mounted) setClients([]);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const goBack = () => router.replace('/empty_dashboard');

  return (
    <main
      className="min-h-screen relative flex items-start justify-center p-8"
      style={{ backgroundColor: palette.pageBg }}
    >
      {/* scale wrapper (keeps same layout visual size) */}
      <div className="origin-top w-full flex items-center justify-center">
        {/* logo */}
        <div className="absolute top-6 left-6">
          <Image
            src="/logo-name.png"
            alt="Scheduling of Care"
            width={220}
            height={80}
            className="object-contain"
            priority
          />
        </div>

        <div className="w-full scale-[0.8] flex items-center justify-center">
          {/* card */}
          <div
            className="w-full max-w-6xl rounded-3xl shadow-lg overflow-hidden relative"
            style={{
              backgroundColor: palette.cardBg,
              border: `1px solid ${palette.border}`,
              minHeight: 720,
            }}
          >
            {/* header */}
            <div
              className="w-full flex items-center justify-center px-8 py-6 relative"
              style={{ backgroundColor: palette.header, color: palette.white }}
            >
              <button
                onClick={goBack}
                aria-label="Go back"
                className="absolute left-4 top-1/2 -translate-y-1/2 rounded-md px-2 py-2 focus:outline-none focus:ring-2 focus:ring-white/60 flex items-center gap-2"
                title="Back"
                style={{ color: palette.white }}
              >
                <BackIcon />
                <span className="text-lg">Back</span>
              </button>
              <h1 className="text-3xl md:text-4xl font-bold">Client List</h1>
            </div>

            {/* content */}
            <div className="px-10 pb-12 pt-8">
              <p className="text-2xl md:text-3xl mb-5" style={{ color: palette.text }}>
                List of registered clients:
              </p>

              {/* list */}
              <div
                className="mx-auto rounded-2xl bg-white overflow-y-auto mb-10"
                style={{ maxHeight: 520, border: `2px solid ${palette.border}55` }}
              >
                <ul className="divide-y divide-black/10">
                  {clients.map((p) => (
                    <li
                      key={p._id}
                      className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 md:gap-6 px-8 py-5"
                      style={{ color: palette.text }}
                    >
                      <span className="text-2xl">{p.name}</span>
                      <div className="flex flex-wrap gap-4">
                        {/* View profile (green) */}
                        <Link
                          href={`/client_profile?id=${p._id}`}
                          className="px-4 py-2 rounded-lg text-lg font-medium"
                          style={{ backgroundColor: palette.editGreen, color: palette.white }}
                        >
                          View profile
                        </Link>

                        {/* View dashboard (orange) */}
                        {p.dashboardType === 'full' ? (
                          <Link
                            href={`/calender_dashboard?id=${p._id}`}
                            className="px-4 py-2 rounded-lg text-lg font-medium"
                            style={{ backgroundColor: palette.dashOrange, color: palette.white }}
                          >
                            View dashboard
                          </Link>
                        ) : (
                          <Link
                            href={`/partial_dashboard?id=${p._id}`}
                            className="px-4 py-2 rounded-lg text-lg font-medium"
                            style={{ backgroundColor: palette.dashOrange, color: palette.white }}
                          >
                            View dashboard
                          </Link>
                        )}

                        {/* optional： Manage carer access */}
                        {/* <Link
                          href={`/management_dashboard/assign_carer/manage`}
                          className="px-4 py-2 rounded-lg text-lg font-medium"
                          style={{
                            backgroundColor: palette.organPink,
                            color: palette.white,
                          }}
                        >
                          Manage carer access
                        </Link> */}
                        
                      </div>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Add new person */}
              <div className="flex justify-center">
                <button
                  onClick={() => router.push('/management_dashboard/register_client?new=true')}
                  className="px-7 py-4 rounded-xl text-2xl font-semibold"
                  style={{ backgroundColor: palette.header, color: palette.white }}
                >
                  + register new client
                </button>
              </div>
            </div>

            {/* help button */}
            <button
              className="absolute bottom-6 right-6 w-10 h-10 rounded-full text-white font-bold"
              style={{ backgroundColor: palette.help }}
              aria-label="Help"
              title="Help"
            >
              ?
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}

function BackIcon({ size = 24 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M15 18l-6-6 6-6" />
    </svg>
  );
}
