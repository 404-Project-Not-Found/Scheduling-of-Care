'use client';

/**
 * Category Cost Page (/budget_report/category-cost/[category])
 * - Inherits the same brown header and pink banner from the Client Schedule / Budget Report page.
 * - Keeps your category budget content unchanged below the banners.
 * - Clicking category on the Budget Report page should route here.
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import Badge from '@/components/ui/Badge';

// ---------- Demo data ----------
type Row = { item: string; category: string; allocated: number; spent: number };
const allRows: Row[] = [
  { item: 'Dental Appointments', category: 'Appointments', allocated: 600, spent: 636 },
  { item: 'Toothbrush Heads',    category: 'Hygiene',      allocated: 30,  spent: 28  },
  { item: 'Socks',               category: 'Clothing',     allocated: 176, spent: 36  },
];

// ---------- Helpers ----------
const unslug = (s: string) =>
  s.split('-').map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join(' ');

type Tone = 'green' | 'yellow' | 'red';
const getStatus = (remaining: number): { tone: Tone; label: string } => {
  if (remaining < 0) return { tone: 'red', label: 'Exceeded' };
  if (remaining <= 5) return { tone: 'yellow', label: 'Nearly Exceeded' };
  return { tone: 'green', label: 'Within Limit' };
};

// ---------- Role helpers (frontend-only; role-aware navigation) ----------
type Role = 'carer' | 'family' | 'management';
function getActiveRole(): Role {
  if (typeof window === 'undefined') return 'carer';
  const r =
    (localStorage.getItem('activeRole') as Role | null) ||
    (sessionStorage.getItem('mockRole') as Role | null) ||
    'carer';
  return (['carer', 'family', 'management'] as const).includes(r as Role)
    ? (r as Role)
    : 'carer';
}

// ---------- Shared palette (same as elsewhere) ----------
const palette = {
  header: '#3A0000',   // dark brown header
  banner: '#F9C9B1',   // pink toolbar
  text:   '#2b2b2b',
  white:  '#FFFFFF',
  pageBg: '#FAEBDC',
};

// HEX → RGBA (for semi-transparent banner)
function hexToRgba(hex: string, alpha = 1) {
  const h = hex.replace('#', '');
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// ---------- Management-only Care Items dropdown (no Tailwind `group`) ----------
function CareItemsMenu() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onEsc(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('click', onDocClick);
    document.addEventListener('keydown', onEsc);
    return () => {
      document.removeEventListener('click', onDocClick);
      document.removeEventListener('keydown', onEsc);
    };
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="hover:opacity-90 font-extrabold text-white"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        Care Items
      </button>

      {open && (
        <div
          role="menu"
          className="absolute left-0 top-full mt-2 w-56 rounded-xl border bg-white text-black shadow-md z-50"
        >
          <Link
            href="/management_dashboard/manage_care_item/edit"
            role="menuitem"
            className="block w-full text-left px-5 py-3 text-sm font-semibold hover:bg-black/5"
            onClick={() => setOpen(false)}
          >
            Edit Care Item
          </Link>
          <Link
            href="/management_dashboard/manage_care_item/add"
            role="menuitem"
            className="block w-full text-left px-5 py-3 text-sm font-semibold hover:bg-black/5"
            onClick={() => setOpen(false)}
          >
            Create / Add Care Item
          </Link>
        </div>
      )}
    </div>
  );
}

// ---------- Page ----------
export default function CategoryCostPage() {
  const router = useRouter();
  const role = getActiveRole();

  // Route param
  const params = useParams<{ category: string }>();
  const categorySlug = params.category;
  const categoryName = unslug(categorySlug);
  const year = '2025';

  // Pink banner state (matches other pages)
  type Client = { id: string; name: string };
  const [clients, setClients] = useState<Client[]>([]);
  const [activeClientId, setActiveClientId] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState<string>('');
  const [openProfileMenu, setOpenProfileMenu] = useState(false);

  useEffect(() => {
    try {
      const raw = typeof window !== 'undefined' ? localStorage.getItem('clients') : null;
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          const cleaned = parsed.filter((c: any) => c && c.id && c.name);
          if (cleaned.length) {
            setClients(cleaned);
            return;
          }
        }
      }
      // Fallback list
      setClients([{ id: 'c-1', name: 'Client A' }, { id: 'c-2', name: 'Client B' }]);
    } catch { /* ignore */ }
  }, []);

  const onClientChange = (id: string) => {
    if (!id) {
      setActiveClientId(null);
      setDisplayName('');
      return;
    }
    const c = clients.find((x) => x.id === id);
    const name = c?.name || '';
    setActiveClientId(id);
    setDisplayName(name);
  };

  const handleLogoClick = () => {
    // Family → partial dashboard; others → calendar dashboard
    if (role === 'family') router.push('/partial_dashboard');
    else router.push('/calender_dashboard');
  };

  const onPrint = () => {
    if (typeof window !== 'undefined') window.print();
  };

  // Filter data for this category
  const rows = useMemo(
    () => allRows.filter((r) => r.category.toLowerCase() === categoryName.toLowerCase()),
    [categoryName]
  );

  const totals = useMemo(() => {
    const allocated = rows.reduce((s, r) => s + r.allocated, 0);
    const spent = rows.reduce((s, r) => s + r.spent, 0);
    return { allocated, spent, remaining: allocated - spent };
  }, [rows]);

  const isManagement = role === 'management';

  return (
    <div className="min-h-screen flex flex-col" style={{ color: palette.text }}>
      {/* ===== Top dark header (same as other pages) ===== */}
      <header
        className="px-5 py-4 flex items-center justify-between text-white"
        style={{ backgroundColor: palette.header }}
      >
        {/* Left: Logo (click → dashboard) + title */}
        <div className="flex items-center gap-4">
          <button
            onClick={handleLogoClick}
            className="inline-flex items-center justify-center"
            aria-label="Go to dashboard"
            title="Dashboard"
          >
            <Image
                src="/logo.png"
                alt="Logo"
                width={80}  /* logo enlarged */
                height={30}
                className="object-contain"
                priority
            />
          </button>
          <span className="font-extrabold leading-none text-2xl md:text-3xl">
            Client Schedule
          </span>
        </div>

        {/* Center: white top nav (same items) */}
        <nav className="hidden lg:flex items-center gap-8 font-extrabold text-white">
          <Link href="/calender_dashboard/budget_report" className="underline underline-offset-4">
            Budget Report
          </Link>
          <Link href="/calender_dashboard/transaction_history" className="hover:opacity-90">
            Transaction History
          </Link>
          {isManagement && <CareItemsMenu />}
        </nav>

        {/* Right: profile avatar dropdown */}
        <div className="relative">
          <button
            onClick={() => setOpenProfileMenu((v) => !v)}
            aria-haspopup="menu"
            aria-expanded={openProfileMenu}
            className="h-10 w-10 rounded-full bg-gray-300 border border-white flex items-center justify-center text-sm font-semibold text-gray-700 hover:opacity-90"
            title="Profile"
          >
            <Image
              src="/default_profile.png"
              alt="Profile"
              width={40}
              height={40}
              className="rounded-full object-cover"
            />
          </button>
          {openProfileMenu && (
            <div
              className="absolute right-0 mt-2 w-56 rounded-xl border bg-white text-black shadow-md"
              role="menu"
            >
              <Link
                href="/calender_dashboard/update_details"
                className="block w-full text-left px-5 py-3 text-sm font-semibold hover:bg-black/5"
                role="menuitem"
              >
                Update Your Details
              </Link>
              <Link
                href="/"
                className="block w-full text-left px-5 py-3 text-sm font-semibold hover:bg.black/5"
                role="menuitem"
              >
                Sign out
              </Link>
            </div>
          )}
        </div>
      </header>

      {/* ===== Pink banner under header (same layout) ===== */}
      <div
        className="px-5 py-4 grid grid-cols-[auto_1fr_auto] items-center gap-4"
        style={{ backgroundColor: hexToRgba(palette.banner, 0.7) }}
      >
        {/* Left: Select Client */}
        <div className="relative inline-block">
          <label className="sr-only">Select Client</label>
          <select
            className="appearance-none h-10 w-56 md:w-64 pl-3 pr-9 rounded-xl border border-black/30 bg-white font-semibold text-base shadow-sm focus:outline-none"
            value={activeClientId || ''}
            onChange={(e) => onClientChange(e.target.value)}
            aria-label="Select client"
          >
            <option value="">{'- Select a client -'}</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-black/60 text-base">▾</span>
        </div>

        {/* Center: Title (same logic) */}
        <div className="justify-self-center -ml-6 md:-ml-10">
          <h1 className="font-extrabold leading-none text-2xl md:text-3xl">
            {displayName ? `${displayName}’s Schedule` : 'Client Schedule'}
          </h1>
        </div>

        {/* Right: Print */}
        <div className="justify-self-end">
          <button
            onClick={onPrint}
            className="inline-flex items-center px-4 py-2 rounded-xl border border-black/30 bg.white font-semibold text-base hover:bg-black/5"
            aria-label="Print"
            title="Print"
          >
            Print
          </button>
        </div>
      </div>

      {/* ===== Category Budget content (unchanged) ===== */}
      <main className="flex-1 bg-[#F8CBA6] flex items-center justify-center">
        <div className="w-full max-w-6xl m-6 rounded-3xl border-4 border-[#3A0000] bg-[#FFF4E6] shadow-md overflow-hidden">
          {/* Top bar */}
          <div className="bg-[#3A0000] px-6 py-4 flex items-center justify-between">
            <h1 className="text-white text-2xl font-semibold">
              {categoryName} Budget Report
            </h1>

            {/* Back to the main Budget Report page */}
            <Link
              href="/budget_report"
              className="rounded-full px-5 py-2 text-black text-sm font-semibold
                         bg-[#FFA94D] hover:bg-[#FF9800] active:bg-[#FF8A00]
                         shadow-md focus:outline-none focus:ring-2 focus:ring-white/70"
              aria-label="Back to Budget Report"
              title="Back to Budget Report"
            >
              Back
            </Link>
          </div>

          {/* Body */}
          <div className="px-6 py-6">
            {/* Overview tiles */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 text-black text-center">
              <div className="rounded-2xl border px-6 py-4 bg-[#F8CBA6] flex flex-col items-center justify-center">
                <div className="text-2xl font-bold">
                  ${totals.allocated.toLocaleString()}
                </div>
                <div className="text-sm">{categoryName} Budget</div>
              </div>

              <div className="rounded-2xl border px-6 py-4 bg-white flex flex-col items-center justify-center">
                <div className="text-2xl font-bold">
                  ${totals.spent.toLocaleString()}
                </div>
                <div className="text-sm">Spent to Date</div>
              </div>

              <div className="rounded-2xl border px-6 py-4 bg-white flex flex-col items-center justify-center">
                <div
                  className={`text-2xl font-bold ${totals.remaining < 0 ? 'text-red-600' : 'text-green-600'}`}
                >
                  {totals.remaining < 0
                    ? `-$${Math.abs(totals.remaining).toLocaleString()}`
                    : `$${totals.remaining.toLocaleString()}`}
                </div>
                <div className="text-sm">Remaining Balance</div>
              </div>
            </div>

            {/* Table */}
            <div className="rounded-2xl border border-[#3A0000] bg-white text-black overflow-hidden">
              <div className="px-4 py-3 bg-[#F4A6A0] flex items.center justify-between">
                <div className="font-semibold">Items in {categoryName}</div>
                <div className="text-sm text-black">Year: {year}</div>
              </div>

              <table className="w-full text-left text-sm">
                <thead className="bg-[#3A0000] text-white">
                  <tr>
                    <th className="px-4 py-3">Item</th>
                    <th className="px-4 py-3">Allocated Budget</th>
                    <th className="px-4 py-3">Amount Spent</th>
                    <th className="px-4 py-3">Remaining</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>

                <tbody>
                  {rows.map((r, i) => {
                    const remaining = r.allocated - r.spent;
                    const status = getStatus(remaining);

                    return (
                      <tr key={i} className="border-t border-[#3A0000]/20">
                        <td className="px-4 py-3">{r.item}</td>
                        <td className="px-4 py-3">${r.allocated}</td>
                        <td className="px-4 py-3">${r.spent}</td>
                        <td className={`px-4 py-3 ${remaining < 0 ? 'text-red-600' : ''}`}>
                          {remaining < 0 ? `-$${Math.abs(remaining)}` : `$${remaining}`}
                        </td>
                        <td className="px-4 py-3">
                          <Badge tone={status.tone}>{status.label}</Badge>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}
