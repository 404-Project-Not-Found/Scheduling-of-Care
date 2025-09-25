'use client';

export const dynamic = 'force-dynamic';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

// ----- Types -----
type Client = { _id: string; name: string; dob: string };

// ----- UI -----
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

// Hardcoded demo clients (family account only; backend remains intact)
const FULL_DASH_ID = 'hardcoded-full-1';
const PARTIAL_DASH_ID = 'hardcoded-partial-1';

const FULL_DASH_CLIENT: Client = {
  _id: FULL_DASH_ID,
  name: 'Mary Hong',
  dob: '2019-12-19',
};

const PARTIAL_DASH_CLIENT: Client = {
  _id: PARTIAL_DASH_ID,
  name: 'John Smith',
  dob: '2018-03-05',
};

export default function FamilyPOAListPage() {
  const router = useRouter();
  const [clients, setClients] = useState<Client[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/clients');
        const data: Client[] = await res.json();
        const hasFull = data.some((c) => c._id === FULL_DASH_ID);
        const hasPartial = data.some((c) => c._id === PARTIAL_DASH_ID);
        const withFull = hasFull ? data : [...data, FULL_DASH_CLIENT];
        const withBoth = hasPartial
          ? withFull
          : [...withFull, PARTIAL_DASH_CLIENT];
        setClients(withBoth);
      } catch {
        setClients([FULL_DASH_CLIENT, PARTIAL_DASH_CLIENT]);
      }
    })();
  }, []);

  const goBack = () => router.replace('/empty_dashboard');

  // Open full (carer) dashboard as family, for the selected client
  function openFullDashboardAsFamily(client: Client) {
    // persist context for other pages
    localStorage.setItem('activeRole', 'family');
    localStorage.setItem('activeClientId', client._id);
    localStorage.setItem('activeClientName', client.name);
    localStorage.setItem('activeClientDob', client.dob);
    localStorage.setItem('lastDashboard', 'full');

    // pass identity explicitly too
    const q = new URLSearchParams({
      viewer: 'family',
      id: client._id,
      name: client.name,
      dob: client.dob,
    });
    router.push(`/full_dashboard?${q.toString()}`);
  }

  // Open partial dashboard for the selected client
  function openPartialDashboard(client: Client) {
    localStorage.setItem('activeRole', 'family');
    localStorage.setItem('activeClientId', client._id);
    localStorage.setItem('activeClientName', client.name);
    localStorage.setItem('activeClientDob', client.dob);
    localStorage.setItem('lastDashboard', 'partial');

    const q = new URLSearchParams({
      name: client.name,
      dob: client.dob,
    });
    router.push(`/partial_dashboard?${q.toString()}`);
  }

  const isFullDash = (c: Client) => c._id === FULL_DASH_ID;

  return (
    <main
      className="min-h-screen relative flex items-start justify-center p-8"
      style={{ backgroundColor: palette.pageBg }}
    >
      <div className="origin-top w-full flex items-center justify-center">
        {/* Logo */}
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
          {/* Card */}
          <div
            className="w-full max-w-6xl rounded-3xl shadow-lg overflow-hidden relative"
            style={{
              backgroundColor: palette.cardBg,
              border: `1px solid ${palette.border}`,
              minHeight: 720,
            }}
          >
            {/* Header */}
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
              <h1 className="text-3xl md:text-4xl font-bold">
                Manage People with Special Needs
              </h1>
            </div>

            {/* Content */}
            <div className="px-10 pb-12 pt-8">
              <p
                className="text-2xl md:text-3xl mb-5"
                style={{ color: palette.text }}
              >
                List of registered family members:
              </p>

              {/* List */}
              <div
                className="mx-auto rounded-2xl bg-white overflow-y-auto mb-10"
                style={{
                  maxHeight: 520,
                  border: `2px solid ${palette.border}55`,
                }}
              >
                <ul className="divide-y divide-black/10">
                  {clients.map((m) => (
                    <li
                      key={m._id}
                      className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 md:gap-6 px-8 py-5"
                      style={{ color: palette.text }}
                    >
                      <span className="text-2xl">{m.name}</span>

                      <div className="flex flex-wrap gap-4">
                        {/* Edit profile */}
                        <Link
                          href={`/client_profile?id=${m._id}`}
                          className="px-4 py-2 rounded-lg text-lg font-medium"
                          style={{
                            backgroundColor: palette.editGreen,
                            color: palette.white,
                          }}
                          onClick={() => {
                            localStorage.setItem('activeRole', 'family');
                            localStorage.setItem('activeClientId', m._id);
                            localStorage.setItem('activeClientName', m.name);
                            localStorage.setItem('activeClientDob', m.dob);
                          }}
                        >
                          Edit profile
                        </Link>

                        {/* Dashboards */}
                        {isFullDash(m) ? (
                          <button
                            onClick={() => openFullDashboardAsFamily(m)}
                            className="px-4 py-2 rounded-lg text-lg font-medium"
                            style={{
                              backgroundColor: palette.dashOrange,
                              color: palette.white,
                            }}
                          >
                            View full dashboard
                          </button>
                        ) : (
                          <button
                            onClick={() => openPartialDashboard(m)}
                            className="px-4 py-2 rounded-lg text-lg font-medium"
                            style={{
                              backgroundColor: palette.dashOrange,
                              color: palette.white,
                            }}
                          >
                            View partial dashboard
                          </button>
                        )}

                        {/* Manage organisation access */}
                        <Link
                          href={`/manage_organisation_access?id=${m._id}`}
                          className="px-4 py-2 rounded-lg text-lg font-medium"
                          style={{
                            backgroundColor: palette.organPink,
                            color: palette.white,
                          }}
                        >
                          Manage organisation access
                        </Link>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Add new client */}
              <div className="flex justify-center">
                <button
                  onClick={() => router.push('/client_profile?new=true')}
                  className="px-7 py-4 rounded-xl text-2xl font-semibold"
                  style={{
                    backgroundColor: palette.header,
                    color: palette.white,
                  }}
                >
                  + Add new person
                </button>
              </div>
            </div>

            {/* Help button */}
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
