/* 
 * File: top_menu/client_schedule
 * Author: Qingyue Zhao
 * Purpose: Reusable header chrome for all calendar/budget/transactions/request pages.
 * - Role detection is handled here (family / carer / management).
 * - Top navigation menu is rendered here; active page gets an underline style.
 * - Pink banner with the centered title changes depending on the page and selected client.
 * - Allows overriding the banner title (e.g. for "X’s Organisation Access").
 */

'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getViewerRoleFE } from '@/lib/mock/mockApi';
import { mockSignOut } from '@/lib/mock/mockSignout';

const palette = {
  header: '#3A0000',
  banner: '#F9C9B1',
  text: '#2b2b2b',
  white: '#FFFFFF',
  pageBg: '#FAEBDC',
};

type PageKey =
  | 'schedule'
  | 'budget'
  | 'transactions'
  | 'request-form'
  | 'request-log'
  | 'care-edit'
  | 'care-add'
  | 'category-cost'
  | 'client-list'
  | 'people-list'
  | 'profile'
  | 'organisation-access';

type ClientLite = { id: string; name: string };

type ChromeProps = {
  page: PageKey;
  clients: ClientLite[];
  activeClientId: string | null;
  onClientChange: (id: string) => void;
  activeClientName?: string;
  topRight?: React.ReactNode; 
  colors: { header: string; banner: string; text: string };
  children: React.ReactNode;
  headerHeight?: number;
  bannerHeight?: number;
  onPrint?: () => void;
  onLogoClick?: () => void;

  /** Avatar controls */
  showAvatar?: boolean;
  avatarSrc?: string;
  onProfile?: () => void;
  onSignOut?: () => void;


};

const ROUTES = {
  schedule: '/calender_dashboard',
  budget: '/calender_dashboard/budget_report',
  transactions: '/calender_dashboard/transaction_history',
  requestForm: '/family_dashboard/request_of_change_page',
  requestLog: '/request-log-page',
  careEdit: '/management_dashboard/manage_care_item/edit',
  careAdd: '/management_dashboard/manage_care_item/add',
  clientList: '/management_dashboard/clients_list',
  peopleList: '/family_dashboard/people_list',
  defaultHome: '/empty_dashboard',
  accountUpdate: '/calender_dashboard/update_details',
  homeByRole: '/empty_dashboard',
  profile: '/client_profile',
  organisationAccess: '/family_dashboard/manage_organisation_access/${id}',
};

/** 
 * Maps each page to its noun form for banner display. 
 */
function nounForPage(page: PageKey): string {
  switch (page) {
    case 'budget': return 'Budget Report';
    case 'transactions': return 'Transactions';
    case 'request-form': return 'Request Form';
    case 'request-log': return 'Requests';
    case 'care-edit':
    case 'care-add': return 'Care Items';
    case 'category-cost': return 'Budget Report';
    case 'client-list': return 'Client List';
    case 'people-list': return 'People List';
    case 'schedule':
    case 'profile': return 'Profile';
    case 'organisation-access': return 'Organisation'
    default: return 'Schedule';
  }
}

/** 
 * underline helper:
 * - normal: underline when page === key
 * - care group: (care-edit|care-add) highlights 'care'
 * - special: on profile, family→people-list, management→client-list
 */
function activeUnderline(
  page: PageKey,
  key: PageKey | 'care',
  role?: 'family' | 'carer' | 'management'
): string {
  const isActiveCare = (page === 'care-edit' || page === 'care-add') && key === 'care';
  const profileMappedTarget =
    role === 'family' ? 'people-list' : role === 'management' ? 'client-list' : null;
  const isProfileMapped = page === 'profile' && key === profileMappedTarget;
  const isActiveDirect = page === key;

  return isActiveCare || isActiveDirect || isProfileMapped
    ? 'underline underline-offset-4'
    : 'hover:underline text-white';
}

/** 
 * Converts HEX to RGBA (used for banner background transparency).
 */
function hexToRgba(hex: string, alpha = 1) {
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export default function DashboardChrome({
  page,
  clients,
  activeClientId,
  onClientChange,
  activeClientName,
  topRight,
  colors,
  children,
  headerHeight = 64,
  bannerHeight = 64,
  onPrint,
  onLogoClick,
  showAvatar = true,
  avatarSrc = '/default_profile.png',
  onProfile,
  onSignOut,
}: ChromeProps) {
  const router = useRouter();

  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const role: 'family' | 'carer' | 'management' = mounted ? getViewerRoleFE() : 'family';
  const isFamily = role === 'family';
  const isManagement = role === 'management';

  // Default noun title (e.g. "Alice’s Budget Report")
  const noun = nounForPage(page);
  const centeredTitle = useMemo(
    () => (activeClientName ? `${activeClientName}’s ${noun}` : `Client ${noun}`),
    [activeClientName, noun]
  );


  const handleLogoClick = () => {
    if (onLogoClick) return onLogoClick();
    router.push(ROUTES.defaultHome);
  };
  const handlePrint = () => {
    if (onPrint) return onPrint();
    if (typeof window !== 'undefined') window.print();
  };

  // Avatar menu
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const goProfile = () => {
    setUserMenuOpen(false);
    if (onProfile) return onProfile();
    router.push(ROUTES.accountUpdate);
  };
  const doSignOut = () => {
    setUserMenuOpen(false);
    if (onSignOut) return onSignOut();
    mockSignOut();
  };

  // hide banner for management client-list & family people-list
  const shouldShowBanner =
    page !== 'client-list' && !(page === 'people-list' && role === 'family');

  return (
    <div className="min-h-screen flex flex-col" style={{ color: colors.text }}>
      {/* ---------- Top Header ---------- */}
      <header
        className="px-8 py-12 flex items-center justify-between text-white"
        style={{ backgroundColor: colors.header, height: headerHeight }}
      >
        {/* Left: Logo + Client Schedule link */}
        <div className="flex items-center gap-8">
          <button
            onClick={handleLogoClick}
            className="flex items-center gap-3 hover:opacity-90"
            title="Go to empty dashboard"
          >
            <Image src="/logo.png" alt="Logo" width={80} height={30} className="object-contain" priority />
          </button>
          <button
            onClick={() => router.push(ROUTES.schedule)}
            className={`font-extrabold leading-none text-2xl md:text-3xl ${
              page === 'schedule' ? 'underline' : 'text-white hover:underline'
            }`}
            title="Go to schedule dashboard"
          >
            <span className="font-extrabold leading-none text-2xl md:text-3xl">Client Schedule</span>
          </button>
        </div>

        {/* Center: navigation menu */}
        <nav className="hidden lg:flex items-center gap-10 font-extrabold text-white text-xl">
          {mounted && isManagement && (
            <Link href={ROUTES.clientList} className={activeUnderline(page, 'client-list', role)}>
              Client List
            </Link>
          )}
          {mounted && isFamily && (
            <>
                <Link href={ROUTES.peopleList} 
                    className={activeUnderline(page, 'people-list', role)}>
                My PWSN
                </Link>
                <Link href={ROUTES.organisationAccess}
                    className={activeUnderline(page, 'organisation-access', role)}>
                Organisation
                </Link>
            </>
          )}
          <Link href={ROUTES.budget} className={activeUnderline(page, 'budget', role)}>
            Budget Report
          </Link>
          <Link href={ROUTES.transactions} className={activeUnderline(page, 'transactions', role)}>
            View Transactions
          </Link>
          {mounted && isFamily && (
            <Link href={ROUTES.requestForm} className={activeUnderline(page, 'request-form', role)}>
              Request Form
            </Link>
          )}
          {mounted && isManagement && (
            <>
              <div className="relative">
                <details className="group">
                  <summary className={`inline-flex items-center gap-2 list-none cursor-pointer ${activeUnderline(page, 'care', role)}`}>
                    Care Items <span className="text-white/90">▼</span>
                  </summary>
                  <div className="absolute left-1/2 -translate-x-1/2 mt-3 w-80 rounded-md border border-white/30 bg-white text-black shadow-2xl z-50">
                    <Link href={ROUTES.careEdit} className="block w-full text-left px-5 py-4 text-xl font-semibold hover:bg-black/5">Manage care item</Link>
                    <Link href={ROUTES.careAdd} className="block w-full text-left px-5 py-4 text-xl font-semibold hover:bg-black/5">Add new care item</Link>
                  </div>
                </details>
              </div>
              <Link href={ROUTES.requestLog} className={activeUnderline(page, 'request-log', role)}>
                Request Log
              </Link>
            </>
          )}
        </nav>

        {/* Right: Avatar */}
        <div className="relative flex items-center gap-4">
          {showAvatar && (
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen((v) => !v)}
                className="h-16 w-16 rounded-full overflow-hidden border-2 border-white/80 hover:border-white focus:outline-none focus:ring-2 focus:ring-white/70"
                aria-haspopup="menu"
                aria-expanded={userMenuOpen}
                title="Account"
              >
                <Image src={avatarSrc} alt="Profile" width={64} height={64} className="h-full w-full object-cover" priority />
              </button>
              {userMenuOpen && (
                <div className="absolute right-0 mt-3 w-80 rounded-md border border-white/30 bg-white text-black shadow-2xl z-50" role="menu">
                  <button className="w-full text-left px-5 py-4 text-xl font-semibold hover:bg-black/5" onClick={goProfile}>Update your details</button>
                  <button className="w-full text-left px-5 py-4 text-xl font-semibold hover:bg-black/5" onClick={doSignOut}>Sign out</button>
                </div>
              )}
            </div>
          )}
          {topRight}
        </div>
      </header>

      {/* ---------- Pink banner ---------- */}
      {shouldShowBanner && (
        <div
          className="px-4 md:px-8 py-2 md:py-4 grid grid-cols-[auto_1fr_auto] items-center"
          style={{ backgroundColor: hexToRgba(palette.banner, 0.8) }}
        >
          {/* Client dropdown */}
          <div className="relative justify-self-start">
            <label className="sr-only">Select Client</label>
            <select
              className="appearance-none h-12 w-56 md:w-64 pl-8 pr-12 rounded-2xl border border-black/30 bg-white font-extrabold text-xl shadow-sm focus:outline-none"
              value={activeClientId || ''}
              onChange={(e) => onClientChange(e.target.value)}
              aria-label="Select client"
            >
              <option value="">{'- Select a client -'}</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-black/60 text-xl">▾</span>
          </div>

        {/* Center title */}
        <div className="relative">
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
                <div className="flex items-center gap-3 justify-center md:-translate-x-16">
                <Link
                    href={ROUTES.profile}
                    aria-label="Open client profile"
                    title="Open client profile"
                    className="rounded-full focus:outline-none focus:ring-2 focus:ring-black/20"
                >
                    <Image
                    src="/default_profile.png"
                    alt="Client avatar"
                    width={40}
                    height={40}
                    priority
                    className="rounded-full border border-black/20 object-cover cursor-pointer hover:opacity-90"
                    />
                </Link>
                <h1 className="font-extrabold leading-none text-2xl md:text-3xl select-none">
                    {centeredTitle}
                </h1>
                </div>
            </div>
        </div>


          {/* Print button (visible only on schedule) */}
          <div className="justify-self-end">
            <button
              onClick={handlePrint}
              className={`inline-flex items-center px-6 py-3 rounded-2xl border border-black/30 bg-white font-extrabold text-xl hover:bg-black/5 ${
                page === 'schedule' ? '' : 'invisible'
              }`}
              title="Print"
              tabIndex={page === 'schedule' ? 0 : -1}
              aria-hidden={page !== 'schedule'}
            >
              Print
            </button>
          </div>
        </div>
      )}

      <main className="flex-1 min-h-0">{children}</main>
    </div>
  );
}

