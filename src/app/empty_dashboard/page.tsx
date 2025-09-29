/**
 * Filename: /empty_dashboard/page.tsx
 * Author: Denise Alexander
 * Date Created: 25/09/2025
 */

'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import FamilySideMenu from '@/components/side_menu/family';
import ManagementSideMenu from '@/components/side_menu/management';
import { useRouter } from 'next/navigation';
import { getSession } from 'next-auth/react';

/** Shared palette (borderless, full-width header/banner) */
const palette = {
  header: '#3A0000', // Dark brown header
  banner: '#F9C9B1', // Pink notice bar
  text: '#2b2b2b',
  white: '#FFFFFF',
  pageBg: '#FAEBDC', // Light beige page background
};

type Role = 'family' | 'management' | null;

export default function EmptyDashboard() {
  const [open, setOpen] = useState(false);
  const [role, setRole] = useState<Role>(null);
  const router = useRouter();

  useEffect(() => {
    const detectRole = async () => {
      /**
       * 1) Frontend mock path:
       *    If NEXT_PUBLIC_ENABLE_MOCK=1 and sessionStorage has "mockRole",
       *    treat it as the source of truth to avoid calling NextAuth.
       *    This lets the UI work without backend/session.
       */
      try {
        const isMock = process.env.NEXT_PUBLIC_ENABLE_MOCK === '1';
        if (isMock && typeof window !== 'undefined') {
          const mockRole = window.sessionStorage.getItem('mockRole') as Role;
          if (mockRole === 'family' || mockRole === 'management') {
            setRole(mockRole);
            return; // stop here in mock mode
          }
        }
      } catch {
        // Ignore any access issues with sessionStorage in older browsers
      }

      /**
       * 2) Real backend path:
       *    Fall back to NextAuth session detection (unchanged from your logic).
       *    If no role in session, redirect to login page.
       */
      const session = await getSession();
      if (session?.user?.role) {
        setRole(session.user.role as Role);
        return;
      }
      router.replace('/');
    };

    detectRole();
  }, [router]);

  /** Close drawer on ESC */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    if (open) document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  if (!role) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-[#F3E9D9] text-zinc-900">
        <div className="text-center">
          <p className="text-4xl font-extrabold mb-4">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen w-full flex flex-col"
      style={{ backgroundColor: palette.pageBg }}
    >
      {/* ===== Full-width top header (NO borders, same height as other pages) ===== */}
      <div
        className="w-full flex items-center justify-center px-8 py-5 relative"
        style={{ backgroundColor: palette.header, color: palette.white }}
      >
        {/* Left hamburger to open drawer */}
        <button
          aria-label="Open menu"
          onClick={() => setOpen(true)}
          className="absolute left-6 top-1/2 -translate-y-1/2 h-11 w-11 rounded-full bg-white flex items-center justify-center"
          title="Open menu"
        >
          <HamburgerIcon size={22} color={palette.header} />
        </button>

        {/* Centered title — use Family/POA Dashboard per your latest design */}
        <h1 className="text-2xl md:text-3xl font-bold">
          {role === 'family' ? 'Family/POA Dashboard' : 'Management Dashboard'}
        </h1>

        {/* Right logo */}
        <div className="absolute right-6 top-1/2 -translate-y-1/2 hidden sm:block">
          <Image
            src="/logo-name.png"
            alt="Scheduling of Care"
            width={140}
            height={36}
            className="object-contain"
            priority
          />
        </div>
      </div>

      {/* ===== Full-width banner (height matches other pages) ===== */}
      <div
        className="w-full px-6 md:px-8 py-5 md:py-6 flex items-center gap-3"
        style={{ backgroundColor: palette.banner }}
      >
        <BellIcon />
        <p
          className="text-base md:text-lg leading-relaxed"
          style={{ color: palette.header }}
        >
          {role === 'family' ? (
            <>
              Click on the menu icon to select a person with special needs under{' '}
              <b>Manage people with special needs</b> to edit their profile,
              view their dashboard, or manage organisation access.
            </>
          ) : (
            <>
              Click on the menu icon to add/select a client under{' '}
              <b>Manage clients</b> to view their dashboard, assign carers or
              organise their care items.
            </>
          )}
        </p>
      </div>

      {/* ===== Main content — borderless, full-bleed section ===== */}
      <section className="w-full flex-1">
        <div className="w-full px-6 md:px-10 py-8 md:py-10">
          {/* TODO: Insert dashboard widgets here */}
        </div>
      </section>

      {/* Drawer */}
      {role === 'family' ? (
        <FamilySideMenu open={open} onBackdropClick={() => setOpen(false)} />
      ) : (
        <ManagementSideMenu open={open} onClose={() => setOpen(false)} />
      )}
    </div>
  );
}

/* ===== Helper icons (SVG only; no external deps) ===== */
function HamburgerIcon({
  size = 24,
  color = 'currentColor',
}: {
  size?: number;
  color?: string;
}) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  );
}

function BellIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="currentColor"
      className="text-[#4A0A0A]"
      aria-hidden="true"
    >
      <path d="M12 2a6 6 0 00-6 6v3.586l-1.707 1.707A1 1 0 005 15h14a1 1 0 00.707-1.707L18 11.586V8a6 6 0 00-6-6zm0 20a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
    </svg>
  );
}
