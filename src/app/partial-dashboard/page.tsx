'use client';

export const dynamic = 'force-dynamic';

import React, { Suspense, useEffect, useState } from 'react';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';

// ---- Color palette ----
const palette = {
  pageBg: '#ffd9b3', // page background
  cardBg: '#FAEBDC', // dashboard inner background
  header: '#3A0000', // dark brown header
  banner: '#F9C9B1', // notice banner
  border: '#3A0000', // card border
  panelBg: '#F7ECD9', // drawer background (not used here yet)
  text: '#2b2b2b', // general text
  white: '#FFFFFF', // white
};

export default function PartialDashboardPage() {
  return (
    <Suspense
      fallback={<div className="p-8 text-xl">Loading dashboard...</div>}
    >
      <PartialDashboardInner />
    </Suspense>
  );
}

function PartialDashboardInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [name, setName] = useState<string>('');
  const [dob, setDob] = useState<string>('');

  // ---- Load query params or localStorage fallback ----
  useEffect(() => {
    const qName = searchParams.get('name');
    const qDob = searchParams.get('dob') || '';

    if (qName) {
      setName(qName);
      setDob(qDob);
      try {
        localStorage.setItem('currentClientName', qName);
        localStorage.setItem('currentClientDob', qDob);
      } catch {}
      return;
    }

    try {
      const savedName = localStorage.getItem('currentClientName');
      const savedDob = localStorage.getItem('currentClientDob') || '';
      if (savedName) {
        setName(savedName);
        setDob(savedDob);
        return;
      }
    } catch {}

    // default: empty state
    setName('');
    setDob('');
  }, [searchParams]);

  // ---- Navigate to client profile ----
  function handleProfileClick() {
    const q = new URLSearchParams();
    if (name) q.set('name', name);
    if (dob) q.set('dob', dob);
    router.push(`/client-profile?${q.toString()}`);
  }

  return (
    <div
      className="min-h-screen w-full flex items-center justify-center px-6 md:px-10 py-8 md:py-10"
      style={{ backgroundColor: palette.pageBg }}
    >
      {/* Outer card */}
      <div
        className="w-full max-w-7xl rounded-2xl md:rounded-3xl overflow-hidden"
        style={{
          backgroundColor: palette.cardBg,
          border: `6px solid ${palette.border}`,
        }}
      >
        {/* Header bar (moved inside the card) */}
        <div
          className="w-full flex items-center justify-center px-8 py-5 relative"
          style={{ backgroundColor: palette.header, color: palette.white }}
        >
          {/* Back button */}
          <button
            onClick={() => router.push('/clients_list')}
            className="absolute left-6 top-1/2 -translate-y-1/2 flex items-center gap-2 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-white/60"
            title="Back to client list"
            aria-label="Back"
          >
            <svg
              width={24}
              height={24}
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
            <span className="text-lg md:text-xl">Back</span>
          </button>

          {/* Title */}
          <h2 className="text-2xl md:text-3xl font-bold">Client Dashboard</h2>

          {/* Profile quick access */}
          <div
            className="absolute right-6 top-1/2 -translate-y-1/2 flex items-center gap-4 cursor-pointer"
            onClick={handleProfileClick}
            title="View profile"
          >
            <span className="text-lg md:text-xl">{name || '…'}</span>
            <div className="w-12 h-12 md:w-14 md:h-14 rounded-full overflow-hidden border">
              <Image
                src="/default_profile.png"
                alt="Default user avatar"
                width={56}
                height={56}
                className="object-cover"
                priority
              />
            </div>
          </div>
        </div>

        {/* Banner */}
        <div
          className="px-6 md:px-8 py-5 md:py-6 border-b"
          style={{ backgroundColor: palette.banner, borderColor: '#e2b197' }}
        >
          <p
            className="text-base md:text-lg leading-relaxed"
            style={{ color: palette.header }}
          >
            This dashboard currently has partial functionality until the
            management completes registration for your client. You will receive
            an email once it&apos;s done.
          </p>
        </div>

        {/* Content area (empty for now) */}
        <div className="p-6 md:p-10 min-h-[60vh] flex items-center justify-center"></div>
      </div>
    </div>
  );
}
