'use client';

import React from 'react';
import Link from 'next/link';
import { signOut } from 'next-auth/react';

type Item = { href: string; label: string };

/** Shared palette (borderless, full-width header/banner) */
const palette = {
  header: '#3A0000', // Dark brown header
  banner: '#F9C9B1', // Pink notice bar
  text: '#2b2b2b',
  white: '#FFFFFF',
  pageBg: '#FAEBDC', // Light beige page background
};

type sideMenuProps = {
  open: boolean;
  onBackdropClick: () => void;
  items?: Item[];
};

// Family menu options
const defaultMenuItems: Item[] = [
  { href: '/update_details', label: 'Update your details' },
  {
    href: '/family_dashboard/family_clients_list',
    label: 'Manage people with special needs',
  },
  { href: '/request_of_change_page', label: 'Request to change a task' },
];

export default function FamilySideMenu({
  open,
  onBackdropClick,
  items = defaultMenuItems,
}: sideMenuProps) {
  const handleSignOut = async () => {
    try {
      await signOut({ redirect: false });
    } catch (err) {
      console.error('Sign-out error:', err);
    } finally {
      window.location.href = '/'; // redirect to login page
    }
  };

  return (
    <>
      {/* ===== Drawer Backdrop ===== */}
      {open && (
        <div
          onClick={onBackdropClick}
          className="fixed inset-0 z-30 bg-black/30"
          aria-hidden="true"
        />
      )}

      {/* ===== Drawer Panel (left slide-in) ===== */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Menu"
        className={`fixed left-0 top-0 z-40 h-full w-[300px] max-w-[85vw] transform transition-transform duration-200 ease-out
          ${open ? 'translate-x-0' : '-translate-x-full'}`}
        style={{ backgroundColor: palette.pageBg }}
      >
        {/* Drawer header — SAME height as page header (py-5), same color */}
        <div
          className="flex items-center justify-between px-8 py-5"
          style={{ backgroundColor: palette.header, color: palette.white }}
        >
          <div className="flex items-center gap-3">
            <HamburgerIcon size={22} color={palette.white} />
            <h2 className="text-lg font-semibold">Menu</h2>
          </div>
          <button
            onClick={onBackdropClick}
            className="rounded px-2 py-1 text-lg hover:opacity-90 focus:outline-none"
            aria-label="Close menu"
            title="Close"
          >
            ✕
          </button>
        </div>

        {/* Drawer body — list + sign out; height excludes header (approx 72px) */}
        <nav className="flex h-[calc(100%-72px)] flex-col justify-between">
          <nav className="p-2 space-y-1">
            {items.map((it) => (
              <MenuItem key={it.href} href={it.href} label={it.label} />
            ))}
          </nav>
          <div className="px-4 pb-6 flex justify-end pr-6">
            {/* Hybrid sign-out: mock mode → clear storage & redirect; else → next-auth signOut */}
            <button
              onClick={handleSignOut}
              className="underline underline-offset-4 focus:outline-none rounded text-lg"
              style={{ color: palette.header }}
            >
              Sign out
            </button>
          </div>
        </nav>
      </div>
    </>
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

/** Single menu item with a small red dot aligned to text baseline */
function MenuItem({ href, label }: { href: string; label: string }) {
  return (
    <li>
      <Link
        href={href}
        className="block rounded-xl px-4 py-3 transition-colors outline-none hover:bg-[#EADBC4] focus-visible:bg-[#EADBC4] active:bg-[#E1D0B5]"
        style={{ color: palette.text }}
      >
        <div className="flex items-start gap-3">
          {/* Dot is fixed-size and slightly nudged to align with text line-height */}
          <span
            aria-hidden="true"
            className="inline-block w-3 h-3 rounded-full shrink-0 mt-[6px]"
            style={{ backgroundColor: '#FF5C5C' }}
          />
          {/* Keep predictable line-height so alignment stays consistent */}
          <div className="text-lg font-medium leading-7">{label}</div>
        </div>
      </Link>
    </li>
  );
}
