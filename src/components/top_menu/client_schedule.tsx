/*
 * File: top_menu/client_schedule
 * Author: Qingyue Zhao
 *
 * Purpose: Reusable header chrome for all calendar/budget/transactions/request pages.
 * - Role detection is handled here (family / carer / management).
 * - Top navigation menu is rendered here; active page gets an underline style.
 * - Pink banner with the centered title changes depending on the page and selected client.
 * - Carer users DO NOT see the client select dropdown in the banner.
 *
 * Last Updated by Denise Alexander - 7/10/2025: active client logic implemented to render the
 * correct client details across pages.
 */

'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { getViewerRole, signOutUser } from '@/lib/data';
import { useActiveClient } from '@/context/ActiveClientContext';

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
  | 'assign-carer'
  | 'staff-list'
  | 'people-list'
  | 'profile'
  | 'organisation-access'
  | 'new-transaction';

// Client object passed from parent component
type ClientLite = {
  id: string;
  name: string;
  orgAccess?: 'approved' | 'pending' | 'revoked';
};

type ChromeProps = {
  page: PageKey;
  clients: ClientLite[];
  onClientChange: (id: string) => void;
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

  /** Overrides for Staff Timetable */
  navItems?: { label: string; href: string }[];
  headerTitle?: string;
  bannerTitle?: string;
  showClientPicker?: boolean;
};

const ROUTES = {
  schedule: '/calendar_dashboard',
  budget: '/calendar_dashboard/budget_report',
  transactions: '/calendar_dashboard/transaction_history',
  requestForm: '/family_dashboard/request_of_change_page',
  requestLog: '/request-log-page',
  careEdit: '/management_dashboard/manage_care_item/edit',
  careAdd: '/management_dashboard/manage_care_item/add',
  clientList: '/management_dashboard/clients_list',
  peopleList: '/family_dashboard/people_list',
  defaultHome: '/empty_dashboard',
  accountUpdate: '/calendar_dashboard/update_details',
  homeByRole: '/empty_dashboard',
  profile: '/client_profile',
  organisationAccess: (clientId: string) =>
    '/family_dashboard/manage_org_access/${clientId}',
  newTransaction: '/calendar_dashboard/budget_report/add_transaction',
};

/** Maps each page to a noun title for the banner. */
function nounForPage(page: PageKey): string {
  switch (page) {
    case 'budget':
      return 'Budget Report';
    case 'transactions':
      return 'Transactions';
    case 'request-form':
      return 'Request Form';
    case 'request-log':
      return 'Requests';
    case 'care-edit':
    case 'care-add':
      return 'Care Items';
    case 'category-cost':
      return 'Budget Report';
    case 'client-list':
      return 'Client List';
    case 'people-list':
      return 'People List';
    case 'schedule':
    case 'profile':
      return 'Profile';
    case 'organisation-access':
      return 'Organisation';
    case 'new-transaction':
      return 'New Transaction';
    default:
      return 'Schedule';
  }
}

/** Underline helper for top nav. */
function activeUnderline(
  page: PageKey,
  key: PageKey | 'care',
  role?: 'family' | 'carer' | 'management'
): string {
  const isActiveCare =
    (page === 'care-edit' || page === 'care-add') && key === 'care';
  const profileMappedTarget =
    role === 'family'
      ? 'people-list'
      : role === 'management'
        ? 'client-list'
        : null;
  const isProfileMapped = page === 'profile' && key === profileMappedTarget;
  const isActiveDirect = page === key;

  return isActiveCare || isActiveDirect || isProfileMapped
    ? 'underline underline-offset-4'
    : 'hover:underline text-white';
}

/** Converts HEX to RGBA (used for banner background). */
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
  onClientChange,
  topRight,
  colors,
  children,
  headerHeight = 64,
  bannerHeight = 64, // (currently unused, kept for API compatibility)
  onPrint,
  showAvatar = true,
  avatarSrc = '/default_profile.png',
  onProfile,
  onSignOut,

  navItems = [],
  headerTitle,
  bannerTitle,
  showClientPicker,
}: ChromeProps) {
  const router = useRouter();
  const pathname = usePathname();

  const [isSignOut, setIsSignOut] = useState(false);
  const [role, setRole] = useState<'family' | 'carer' | 'management' | null>(
    null
  );
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  // Active client context - used to track and update currently selected client
  const {
    client: activeClient,
    handleClientChange,
    resetClient,
  } = useActiveClient();

  // Fetches user role on mount
  useEffect(() => {
    const loadRole = async () => {
      try {
        const r = await getViewerRole();
        setRole(r);
      } catch {
        setRole(null);
        router.replace('/');
      }
    };
    loadRole();
  }, [router]);

  // When a new client is selected from dropdown, updates active client data
  const onSelectClientChange = (id: string) => {
    const selected = clients.find((c) => c.id === id);
    if (!selected) return;
    handleClientChange(selected.id, selected.name);
    onClientChange(id);
  };

  // Role flags for conditional rendering
  const isCarer = role === 'carer';
  const isFamily = role === 'family';
  const isManagement = role === 'management';

  // Default banner title
  const noun = nounForPage(page);
  const bannerDefault = useMemo(() => {
    return activeClient.id && activeClient.name
      ? `${activeClient.name}'s ${noun}`
      : 'No Client Selected';
  }, [activeClient, noun]);

  const computedBannerTitle = bannerTitle ?? bannerDefault;

  const computedHeaderTitle =
    headerTitle ??
    (isFamily
      ? 'PWSN Schedule'
      : isCarer
        ? 'Carer Dashboard'
        : 'Client Schedule');

  // Client picker visibility: explicit prop wins; else hide for carers
  const pickerVisible = showClientPicker ?? !isCarer;

  const showTitleBlock =
    typeof computedBannerTitle === 'string' &&
    computedBannerTitle.trim().length > 0;

  const handleLogoClick = () => {
    router.push('/schedule_dashboard');
  };

  const handlePrint = () => {
    if (onPrint) return onPrint();
    if (typeof window !== 'undefined') window.print();
  };

  // Avatar menu
  const goProfile = () => {
    setUserMenuOpen(false);
    if (onProfile) return onProfile();
    router.push(ROUTES.accountUpdate);
  };

  const doSignOut = async () => {
    setIsSignOut(true);
    setUserMenuOpen(false);
    if (onSignOut) {
      onSignOut();
    } else {
      await resetClient();
      await signOutUser();
    }
    router.push('/');
  };

  if (!role) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-[#F3E9D9] text-zinc-900">
        <div className="text-center">
          <h2 className="text-4xl font-extrabold mb-4">Loading...</h2>
        </div>
      </div>
    );
  }

  if (isSignOut) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-[#F3E9D9] text-zinc-900">
        <div className="text-center">
          <h2 className="text-4xl font-extrabold mb-4">Logging out...</h2>
        </div>
      </div>
    );
  }

  // Hide banner for management client-list & family people-list (unchanged from your logic)
  const shouldShowBanner =
    page !== 'client-list' &&
    page !== 'staff-list' &&
    page !== 'assign-carer' &&
    !(page === 'people-list' && role === 'family');

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
            <Image
              src="/logo.png"
              alt="Logo"
              width={80}
              height={30}
              className="object-contain"
              priority
            />
          </button>
          {page === 'staff-list' || page === 'assign-carer' ? (
            <span className="font-extrabold leading-none text-2xl md:text-3xl select-none cursor-default">
              {computedHeaderTitle}
            </span>
          ) : (
            <button
              onClick={() => router.push(ROUTES.schedule)}
              className={`font-extrabold leading-none text-2xl md:text-3xl ${
                page === 'schedule' ? 'underline' : 'text-white hover:underline'
              }`}
              title="Go to schedule dashboard"
            >
              <span className="font-extrabold leading-none text-2xl md:text-3xl">
                {computedHeaderTitle}
              </span>
            </button>
          )}
        </div>

        {/* Center: navigation menu */}
        <nav className="hidden lg:flex items-center gap-14 font-extrabold text-white text-xl px-2">
          {navItems && navItems.length > 0 ? (
            <>
              {navItems.map((item) => {
                const active =
                  pathname === item.href ||
                  pathname.startsWith(item.href + '/');
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={
                      active
                        ? 'px-2 py-1 underline underline-offset-4'
                        : 'px-2 py-1 text-white hover:underline'
                    }
                  >
                    {item.label}
                  </Link>
                );
              })}
            </>
          ) : (
            <>
              {isManagement && (
                <Link
                  href={ROUTES.clientList}
                  className={activeUnderline(page, 'client-list', role!)}
                >
                  Client List
                </Link>
              )}

              {isFamily && (
                <>
                  <Link
                    href={ROUTES.peopleList}
                    className={activeUnderline(page, 'people-list', role!)}
                  >
                    My PWSNs
                  </Link>
                  <Link
                    href={
                      activeClient.id
                        ? ROUTES.organisationAccess(activeClient.id)
                        : '#'
                    }
                    className={
                      activeClient.id
                        ? activeUnderline(page, 'organisation-access', role!)
                        : 'cursor-not-allowed opacity-50'
                    }
                    onClick={(e) => {
                      if (!activeClient.id) e.preventDefault();
                    }}
                  >
                    Organisation
                  </Link>
                </>
              )}

              <Link
                href={ROUTES.budget}
                className={activeUnderline(page, 'budget', role!)}
              >
                Budget Report
              </Link>
              <Link
                href={ROUTES.transactions}
                className={activeUnderline(page, 'transactions', role!)}
              >
                View Transactions
              </Link>

              {isFamily && (
                <Link
                  href={ROUTES.requestForm}
                  className={activeUnderline(page, 'request-form', role!)}
                >
                  Request Form
                </Link>
              )}

              {isManagement && (
                <>
                  <div className="relative">
                    <details className="group">
                      <summary
                        className={`inline-flex items-center gap-2 list-none cursor-pointer ${activeUnderline(page, 'care', role!)}`}
                      >
                        Care Items <span className="text-white/90">▼</span>
                      </summary>
                      <div className="absolute left-1/2 -translate-x-1/2 mt-3 w-80 rounded-md border border-white/30 bg-white text-black shadow-2xl z-50">
                        <Link
                          href={ROUTES.careAdd}
                          className="block w-full text-left px-5 py-4 text-xl font-semibold hover:bg-black/5"
                        >
                          Add a new care item
                        </Link>
                        <Link
                          href={ROUTES.careEdit}
                          className="block w-full text-left px-5 py-4 text-xl font-semibold hover:bg-black/5"
                        >
                          Edit a care item
                        </Link>
                      </div>
                    </details>
                  </div>
                  <Link
                    href={ROUTES.requestLog}
                    className={activeUnderline(page, 'request-log', role!)}
                  >
                    Request Log
                  </Link>
                </>
              )}
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
                <Image
                  src={avatarSrc}
                  alt="Profile"
                  width={64}
                  height={64}
                  className="h-full w-full object-cover"
                  priority
                />
              </button>
              {userMenuOpen && (
                <div
                  className="absolute right-0 mt-3 w-80 rounded-md border border-white/30 bg-white text-black shadow-2xl z-50"
                  role="menu"
                >
                  <button
                    className="w-full text-left px-5 py-4 text-xl font-semibold hover:bg-black/5"
                    onClick={goProfile}
                  >
                    Update your details
                  </button>
                  <button
                    className="w-full text-left px-5 py-4 text-xl font-semibold hover:bg-black/5"
                    onClick={doSignOut}
                  >
                    Log out
                  </button>
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
          className={`relative isolate px-4 md:px-8 py-2 md:py-4 grid grid-cols-[auto_1fr_auto] itemrelative isolate px-4 md:px-8 py-2 md:py-4 grid grid-cols-[auto_1fr_auto] items-center`}
        >
          <div
            className="absolute inset-0 z-0 pointer-events-none"
            style={{ backgroundColor: hexToRgba(palette.banner, 0.8) }}
            aria-hidden
          />
          {/* Left: client picker */}

          {pickerVisible ? (
            <div className="relative justify-self-start">
              <label className="sr-only">Select Client</label>
              <select
                className="appearance-none h-12 w-56 md:w-64 pl-8 pr-12 rounded-2xl border border-black/30 bg-white font-extrabold text-xl shadow-sm focus:outline-none"
                value={activeClient.id || ''}
                onChange={(e) => onSelectClientChange(e.target.value)}
                aria-label="Select client"
              >
                <option value="">{'- Select a client -'}</option>
                {clients
                  .filter((c) =>
                    isManagement ? c.orgAccess === 'approved' : true
                  )
                  .map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
              </select>
              <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-black/60 text-xl">
                ▾
              </span>
            </div>
          ) : (
            // Spacer to preserve grid layout when dropdown is hidden for carers
            <div className="h-12 w-56 md:w-64" aria-hidden />
          )}

          {/* Center title */}
          <div className="relative z-10">
            {showTitleBlock ? (
              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
                <div className="flex items-center gap-3 justify-center">
                  <Image
                    src="/default_profile.png"
                    alt="Client avatar"
                    width={40}
                    height={40}
                    priority
                    className="rounded-full border border-black/20 object-cover"
                  />
                  <h1 className="font-extrabold leading-none text-2xl md:text-3xl select-none">
                    {computedBannerTitle}
                  </h1>
                </div>
              </div>
            ) : (
              <div className="h-10" />
            )}
          </div>

          {/* Right: Print button — ONLY management on Schedule */}
          <div className="relative z-10 justify-self-end">
            {page === 'schedule' && isManagement && (
              <button
                onClick={handlePrint}
                className="relative z-20 inline-flex items-center px-6 py-3 rounded-2xl border border-black/30 bg-white font-extrabold text-xl hover:bg-black/5"
                title="Print"
              >
                Print
              </button>
            )}
          </div>
        </div>
      )}

      <main className="flex-1 min-h-0">{children}</main>
    </div>
  );
}
