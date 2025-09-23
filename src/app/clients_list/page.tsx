'use client';

export const dynamic = 'force-dynamic';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

const palette = {
  pageBg: '#ffd9b3',
  cardBg: '#F7ECD9',
  header: '#3A0000',
  text: '#2b2b2b',
  border: '#3A0000',
  help: '#ff9999',
  white: '#ffffff',
  editGreen: '#4CAF50', // green
  dashOrange: '#FF9800', // orange
  organPink: '#E91E63', // pink
};

type Client = {
  _id: string;
  name: string;
  dob: string;
};

/* hardcoded members list for demo
const members = [
  { name: 'Jane Smith', dob: '1943-09-16' },
  { name: 'Harry Dong', dob: '1950-01-01' },
  { name: 'Jose Lin', dob: '1955-05-12' },
  { name: 'Kevin Wu', dob: '1960-07-20' },
  { name: 'Mickey Mouse', dob: '1970-03-01' },
];
*/

export default function FamilyPOAListPage() {
  const router = useRouter();
  const [clients, setClients] = useState<Client[]>([]);

  useEffect(() => {
    async function fetchClients() {
      const res = await fetch('/api/clients');
      const data = await res.json();
      setClients(data);
    }
    fetchClients();
  }, []);

  const goBack = () => router.replace('/menu/family');

  return (
    <main
      className="min-h-screen relative flex items-start justify-center p-8"
      style={{ backgroundColor: palette.pageBg }}
    >
      {/* === Scale wrapper: shrink everything inside by 20% (0.8) ===
          Use origin-top to keep the layout anchored to the top while scaling */}
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
                {/* Add Back text next to the arrow */}
                <span className="text-lg">Back</span>
              </button>
              <h1 className="text-3xl md:text-4xl font-bold">
                Manage People with Special Needs
              </h1>
            </div>

            {/* content */}
            <div className="px-10 pb-12 pt-8">
              <p
                className="text-2xl md:text-3xl mb-5"
                style={{ color: palette.text }}
              >
                List of registered family members:
              </p>

              {/* list */}
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
                        {/* Edit profile → green */}
                        <Link
                          href={`/client_profile?id=${m._id}`}
                          className="px-4 py-2 rounded-lg text-lg font-medium"
                          style={{
                            backgroundColor: palette.editGreen,
                            color: palette.white,
                          }}
                        >
                          Edit profile
                        </Link>

                        {/* View dashboard → orange */}
                        <Link
                          href={`/partial_dashboard?name=${encodeURIComponent(m.name)}`}
                          className="px-4 py-2 rounded-lg text-lg font-medium"
                          style={{
                            backgroundColor: palette.dashOrange,
                            color: palette.white,
                          }}
                        >
                          View dashboard
                        </Link>

                        {/* Manage organisation access → pink (now passes both name + dob) */}
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
