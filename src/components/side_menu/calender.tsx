'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { mockSignOut } from '@/lib/mock/mockSignout';

const palette = {
  panelBg: '#F7ECD9',
  header: '#4A0A0A',
  text: '#2b2b2b',
  white: '#FFFFFF',
};

/* ================= Reusable Menu Drawer ================= */
export function MenuDrawer({
  open,
  onClose,
  viewer, // optional: 'carer' | 'family' | 'management' 
}: {
  open: boolean;
  onClose: () => void;
  viewer?: 'carer' | 'family' | 'management';
}) {
  // Close drawer with ESC
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    if (open) document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  function onBackdropClick(e: React.MouseEvent<HTMLDivElement>) {
    if (e.target === e.currentTarget) onClose();
  }

  // Detect "family" viewer even if prop not provided (fallback to frontend mock role)
  const isFamilyViewer =
    viewer === 'family' ||
    (typeof window !== 'undefined' &&
      (localStorage.getItem('activeRole') || '').toLowerCase() === 'family');

  return (
    <>
      {open && (
        <div
          onClick={onBackdropClick}
          className="fixed inset-0 z-30 bg-black/30"
          aria-hidden="true"
        />
      )}

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
        <div
          className="flex items-center justify-between px-4 py-3"
          style={{ backgroundColor: palette.header, color: palette.white }}
        >
          <div className="flex items-center gap-3">
            <HamburgerIcon size={22} color={palette.white} />
            <h2 className="text-lg font-semibold">Menu</h2>
          </div>
          <button
            onClick={onClose}
            className="rounded px-2 py-1 text-lg hover:opacity-90 focus:outline-none"
            aria-label="Close menu"
          >
            ✕
          </button>
        </div>

        <nav className="flex h-[calc(100%-56px)] flex-col justify-between">
          <ul className="px-3 py-4 space-y-2">
            {/* Existing items */}
            <MenuItem href="/calender_dashboard/update_details" label="Update your details" />
            <MenuItem href="/calender_dashboard/budget_report" label="Budget Report" />
            <MenuItem href="/calender_dashboard/transaction_history" label="View Transactions" />

            {/* Extra entries only for FAMILY viewer on calender dashboard */}
            {isFamilyViewer && (
              <>
                <MenuItem
                  href="/people_list"
                  label="Manage people with special needs"
                />
                <MenuItem
                  href="/request_of_change_page"
                  label="Request to change a task"
                />
              </>
            )}
          </ul>

          <div className="px-4 pb-6 flex justify-end pr-6">
            <Link
              href="/"
              onClick={(e) => {
                e.preventDefault();
                mockSignOut();
              }}
              className="underline underline-offset-4 focus:outline-none rounded text-lg"
              style={{ color: palette.header }}
            >
              Sign out
            </Link>
          </div>
        </nav>
      </div>
    </>
  );
}

export default function MenuPage() {
  const [open, setOpen] = React.useState(true);
  return <MenuDrawer open={open} onClose={() => setOpen(false)} />;
}

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
