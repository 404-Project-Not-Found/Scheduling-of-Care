'use client';

export const dynamic = 'force-dynamic';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { signOut } from 'next-auth/react';

// ---- Color palette ----
const palette = {
  pageBg: '#ffd9b3', // page background
  header: '#3A0000', // dark brown
  banner: '#F9C9B1', // notice banner
  panelBg: '#fdf4e7', // panel background
  text: '#2b2b2b',
  white: '#FFFFFF',
};

export default function MenuPage() {
  const [open, setOpen] = useState(false);

  // Close drawer with ESC
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    if (open) document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  // Backdrop click to close
  function onBackdropClick(e: React.MouseEvent<HTMLDivElement>) {
    if (e.target === e.currentTarget) setOpen(false);
  }

  return (
    <div
      className="min-h-screen w-full flex items-center justify-center px-6 md:px-10 py-8 md:py-10 relative"
      style={{ backgroundColor: palette.pageBg }}
    >
      {/* ===== Centered Card (same layout as partial dashboard) ===== */}
      <div
        className="w-full max-w-7xl rounded-2xl md:rounded-3xl overflow-hidden"
        style={{
          backgroundColor: palette.panelBg,
          border: `6px solid ${palette.header}`,
        }}
      >
        {/* Top bar inside the card (dark brown) */}
        <div
          className="w-full flex items-center justify-center px-8 py-5 relative"
          style={{ backgroundColor: palette.header, color: palette.white }}
        >
          {/* Round hamburger triggers the drawer */}
          <button
            aria-label="Open menu"
            onClick={() => setOpen(true)}
            className="absolute left-6 top-1/2 -translate-y-1/2 h-11 w-11 rounded-full bg-white flex items-center justify-center shrink-0"
            title="Open menu"
          >
            <HamburgerIcon size={22} color={palette.header} />
          </button>

          {/* Title centered; small brand mark on the right if you like */}
          <h1 className="text-2xl md:text-3xl font-bold">
            Family/POA Dashboard
          </h1>

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

        {/* Notice banner */}
        <div
          className="w-full border-b px-6 md:px-8 py-4 flex items-center gap-3"
          style={{ backgroundColor: palette.banner, borderColor: '#e2b197' }}
        >
          <BellIcon />
          <p className="text-base md:text-lg" style={{ color: palette.header }}>
            Select a person with special needs under the menu option manage
            people with special needs to edit their profile, view their care
            items or manage organisation access.
          </p>
        </div>

        {/* Main content area (empty for now, same height as partial) */}
        <div className="p-6 md:p-10 min-h-[60vh]" />
      </div>

      {/* ===== Drawer Backdrop ===== */}
      {open && (
        <div
          onClick={onBackdropClick}
          className="fixed inset-0 z-30 bg-black/30"
          aria-hidden="true"
        />
      )}

      {/* ===== Drawer Panel ===== */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Menu"
        className={`fixed left-0 top-0 z-40 h-full w-[300px] max-w-[85vw] transform transition-transform duration-200 ease-out
          ${open ? 'translate-x-0' : '-translate-x-full'}`}
        style={{
          backgroundColor: palette.panelBg,
          borderRight: `3px solid ${palette.header}`,
        }}
      >
        {/* Drawer header */}
        <div
          className="flex items-center justify-between px-4 py-3"
          style={{ backgroundColor: palette.header, color: palette.white }}
        >
          <div className="flex items-center gap-3">
            <HamburgerIcon size={22} color={palette.white} />
            <h2 className="text-lg font-semibold">Menu</h2>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="rounded px-2 py-1 text-lg hover:opacity-90 focus:outline-none"
            aria-label="Close menu"
            title="Close"
          >
            ✕
          </button>
        </div>

        {/* Drawer body */}
        <nav className="flex h-[calc(100%-56px)] flex-col justify-between">
          <ul className="px-3 py-4 space-y-2">
            <MenuItem href="/update_details" label="Update your details" />
            <MenuItem
              href="/request_of_change_page"
              label="Request to change a task"
            />
            <MenuItem href="/create_access_code" label="Create access code" />
            <MenuItem
              href="/clients_list"
              label="Manage people with special needs"
            />
          </ul>

          <div className="px-4 pb-6 flex justify-end pr-6">
            <button
              onClick={async () => {
                await signOut({ redirect: false });
                window.location.href = '/'; // redirect to login page
              }}
              className="underline underline-offset-4 focus:outline-none rounded text-lg"
              style={{ color: palette.header }}
            >
              Sign out
            </button>
          </div>
        </nav>
      </div>
    </div>
  );
}

/* ================= Helpers ================= */

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

function MenuItem({ href, label }: { href: string; label: string }) {
  return (
    <li>
      <Link
        href={href}
        className="block rounded-xl px-4 py-3 transition-colors outline-none
                   hover:bg-[#EADBC4] focus-visible:bg-[#EADBC4] active:bg-[#E1D0B5]"
        style={{ color: palette.text }}
      >
        <div className="flex items-center gap-3">
          <span
            aria-hidden="true"
            className="inline-block h-3 w-3 rounded-full"
            style={{ backgroundColor: '#FF5C5C' }}
          />
          <div className="text-lg font-medium">{label}</div>
        </div>
      </Link>
    </li>
  );
}
