'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { signOut } from 'next-auth/react';

/** Shared palette (borderless, full-width header/banner) */
const palette = {
  header: '#3A0000', // Dark brown header
  banner: '#F9C9B1', // Pink notice bar
  text: '#2b2b2b',
  white: '#FFFFFF',
  pageBg: '#FAEBDC', // Light beige page background
};

export default function MenuPage() {
  const [open, setOpen] = useState(false);

  /** Close drawer on ESC */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    if (open) document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  /** Close drawer by clicking the backdrop */
  function onBackdropClick(e: React.MouseEvent<HTMLDivElement>) {
    if (e.target === e.currentTarget) setOpen(false);
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
        <h1 className="text-2xl md:text-3xl font-bold">Family/POA Dashboard</h1>

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
          Select a person with special needs under{' '}
          <b>Manage people with special needs</b> to edit their profile, view
          their dashboard, or manage organisation access.
        </p>
      </div>

      {/* ===== Main content — borderless, full-bleed section ===== */}
      <section className="w-full flex-1">
        <div className="w-full px-6 md:px-10 py-8 md:py-10">
          {/* TODO: Insert dashboard widgets here */}
        </div>
      </section>

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
            onClick={() => setOpen(false)}
            className="rounded px-2 py-1 text-lg hover:opacity-90 focus:outline-none"
            aria-label="Close menu"
            title="Close"
          >
            ✕
          </button>
        </div>

        {/* Drawer body — list + sign out; height excludes header (approx 72px) */}
        <nav className="flex h-[calc(100%-72px)] flex-col justify-between">
          <ul className="px-3 py-4 space-y-2">
            <MenuItem href="/update_details" label="Update your details" />
            <MenuItem
              href="/clients_list"
              label="Manage people with special needs"
            />
            <MenuItem
              href="/request_of_change_page"
              label="Request to change a task"
            />
            {/* Removed "Create access code" per your latest requirement */}
          </ul>

          <div className="px-4 pb-6 flex justify-end pr-6">
            {/* Keep backend sign-out logic via next-auth */}
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
