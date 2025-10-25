/*
 * File: src/components/top_menu/client_schedule.tsx
 * Author: Qingyue Zhao
 *
 * Purpose: Reusable header chrome for all calendar/budget/transactions/request pages.
 * - Role detection is handled here (family / carer / management).
 * - Top navigation menu is rendered here; active page gets an underline style.
 * - Pink banner with the centered title changes depending on the page and selected client.
 * - Client select dropdown is shown for ALL roles (family / carer / management).
 *
 * Updated by Denise Alexander (20/10/2025): UI design and layout changes for readability,
 * consistency and better navigation.
 * Updated by Denise Alexander (23/10/2025):
 * - Reordered heading + sub headings based on role:
 *    - family/POA: switched care schedule and My PWSN
 *    - management: switched care schedule and Client List
 * - Wording changes:
 *    - Client -> PWSN (for family/POA users)
 *    - Oragnisation -> Service Provider
 *
 * Last Updated by Denise Alexander (24/10/2025): added logo to My PWSN/Client List, adjusted text size
 * and redirection logic.
 */

'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { getViewerRole, signOutUser } from '@/lib/data';
import { useActiveClient } from '@/context/ActiveClientContext';
import AccessDropdown from '@/components/top_menu/AccessDropdown';
import {
  ChevronDown,
  User,
  ArrowLeft,
  FileText,
  Receipt,
  ClipboardList,
  Contact,
  HouseHeart,
  LogOut,
  SquareCheckBig,
  SquarePlus,
  Settings2,
  Printer,
  UserSearch,
} from 'lucide-react';

const palette = {
  header: '#3A0000',
  banner: '#F9C9B1',
  text: '#2b2b2b',
  white: '#FFFFFF',
  pageBg: '#FAEBDC',
};

type PageKey =
  | 'client-schedule'
  | 'staff-schedule'
  | 'budget'
  | 'transactions'
  | 'request-form'
  | 'request-log'
  | 'care-edit'
  | 'care-edit-picker'
  | 'care-add'
  | 'category-cost'
  | 'client-list'
  | 'staff-list'
  | 'people-list'
  | 'profile'
  | 'organisation-access'
  | 'new-transaction';

type ClientLite = {
  id: string;
  name: string;
  orgAccess?: 'approved' | 'pending' | 'revoked';
};

interface UserResponse {
  email: string;
  role: string;
  fullName: string;
  phone?: string;
  profilePic?: string | null;
}

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

  // Avatar controls
  showAvatar?: boolean;
  avatarSrc?: string;
  onProfile?: () => void;
  onSignOut?: () => void;

  // Optional overrides
  navItems?: { label: string; href: string }[];
  headerTitle?: string;
  bannerTitle?: string;

  /**
   * Force showing the client picker. (Now shown for ALL roles by default.)
   */
  showClientPicker?: boolean;

  /** Hide the banner entirely for this page (default: false) */
  hideBanner?: boolean;
};

const ROUTES = {
  schedule: '/calendar_dashboard',
  staffSchedule: '/management_dashboard/staff_schedule',
  budget: '/calendar_dashboard/budget_report',
  transactions: '/calendar_dashboard/transaction_history',
  requestLog: '/request-log-page',
  careEdit: '/management_dashboard/manage_care_item/edit',
  careAdd: '/management_dashboard/manage_care_item/add',
  clientList: '/management_dashboard/clients_list',
  peopleList: '/family_dashboard/people_list',
  accountUpdate: '/calendar_dashboard/update_details',
  profile: '/client_profile',
  organisationAccess: (clientId: string) =>
    '/family_dashboard/manage_org_access/${clientId}',
  newTransaction: '/calendar_dashboard/budget_report/add_transaction',
};

function nounForPage(page: PageKey): string {
  switch (page) {
    case 'budget':
      return 'Budget Report';
    case 'transactions':
      return 'Transactions';
    case 'request-form':
      return 'Family Request Form';
    case 'request-log':
      return 'Family Requests';
    case 'care-edit':
    case 'care-add':
      return 'Care Items';
    case 'category-cost':
      return 'Budget Report';
    case 'client-list':
      return 'Client List';
    case 'people-list':
      return 'People List';
    case 'profile':
      return 'Profile';
    case 'client-schedule':
      return 'Care Schedule';
    case 'staff-schedule':
      return 'Staff Schedule';
    case 'staff-list':
      return 'Staff List';
    case 'organisation-access':
      return 'Service Provider';
    case 'new-transaction':
      return 'New Transaction';
    default:
      return 'Care Schedule';
  }
}

/** Helper for underline on active nav link. */
function activeUnderline(
  page: PageKey,
  key: PageKey | 'care',
  role?: 'family' | 'carer' | 'management'
): string {
  const isActiveCare =
    (page === 'care-edit' || page === 'care-add') && key === 'care';

  const profileMappedTarget = role === 'family' ? 'people-list' : null;

  const isProfileMapped =
    page === 'profile' && key === (profileMappedTarget as PageKey);

  const isActiveDirect = page === key;

  const base =
    'text-white relative inline-block px-3 py-2 text-center transition-all duration-200';

  const underlineClasses =
    'after:content-[""] after:block after:w-[80%] after:h-[3px] after:rounded-full after:absolute after:bottom-0 after:left-1/2 after:-translate-x-1/2 after:mt-2';

  if (isActiveCare || isActiveDirect || isProfileMapped) {
    return `${base} ${underlineClasses} after:bg-white`;
  } else {
    return `${base} hover:after:content-[""] hover:after:block hover:after:w-[80%] hover:after:h-[3px] hover:after:rounded-full hover:after:bg-white/70 hover:after:absolute hover:after:bottom-0 hover:after:left-1/2 hover:after:-translate-x-1/2 hover:after:mt-2 hover:-translate-y-1`;
  }
}

/** HEX → RGBA (banner background overlay). */
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
  onPrint,
  showAvatar = true,
  onProfile,
  onSignOut,

  navItems = [],
  headerTitle,
  bannerTitle,
  showClientPicker,

  hideBanner = false,
}: ChromeProps) {
  const router = useRouter();
  const pathname = usePathname();

  const [isSignOut, setIsSignOut] = useState(false);
  const [role, setRole] = useState<'family' | 'carer' | 'management' | null>(
    null
  );
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const {
    client: activeClient,
    handleClientChange,
    resetClient,
  } = useActiveClient();

  const [user, setUser] = useState<UserResponse | null>(null);

  // Fetch user details for avatar
  useEffect(() => {
    const fetchUser = async () => {
      const res = await fetch('/api/v1/user/profile');
      const data: UserResponse = await res.json();
      setUser(data);
    };
    fetchUser();
  }, []);

  // Load viewer role once
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

  const isCarer = role === 'carer';
  const isFamily = role === 'family';
  const isManagement = role === 'management';

  // Header title click → client/PWSN lists
  const goScheduleHome = () => {
    if (page === 'staff-schedule' || page === 'staff-list') {
      router.push(ROUTES.staffSchedule);
      return;
    }

    if (isManagement || isCarer) {
      router.push(ROUTES.clientList);
    } else if (isFamily) {
      router.push(ROUTES.peopleList);
    } else {
      router.push(ROUTES.schedule);
    }
  };

  // -------- Derived UI text --------
  const noun = useMemo(() => nounForPage(page), [page]);
  const bannerDefault = useMemo(() => {
    return activeClient.id && activeClient.name
      ? `${activeClient.name}'s ${noun}`
      : noun;
  }, [activeClient, noun]);
  const computedBannerTitle = bannerTitle ?? bannerDefault;

  const computedHeaderTitle =
    headerTitle ??
    (isFamily ? 'My PWSN' : isManagement ? 'Client List' : 'Care Schedule');

  // -------- Banner picker visibility --------
  // Now: ALWAYS visible for all roles (carer/family/management), unless explicitly hidden via prop.
  const pickerVisible = showClientPicker ?? true;

  // -------- Role-only filtering for custom navItems --------
  const safeNavItems =
    !navItems || navItems.length === 0
      ? []
      : isManagement
        ? navItems
        : navItems.filter(
            (n) =>
              // strip staff-only links for non-management
              !/staff[-\s]*list/i.test(n.label) &&
              !/management_dashboard/i.test(n.href)
          );

  // -------- Handlers --------
  const onSelectClientChange = (id: string) => {
    const selected = clients.find((c) => c.id === id);
    if (!selected) return;
    handleClientChange(selected.id, selected.name);
    onClientChange(id);
  };

  const handleLogoClick = () => {
    router.push('/icon_dashboard');
  };

  const handlePrint = () => {
    if (onPrint) return onPrint();
    if (typeof window !== 'undefined') window.print();
  };

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

  // Hide banner when explicitly requested or on specific pages
  const shouldShowBanner =
    !hideBanner &&
    page !== 'client-list' &&
    page !== 'staff-list' &&
    !(page === 'people-list' && isFamily);

  // Determines whether the header title should be underlined or not
  const isHeaderActive =
    (isManagement && page === 'client-list') ||
    (isCarer && page === 'client-list') ||
    (isFamily && page === 'people-list');

  return (
    <div className="min-h-screen flex flex-col" style={{ color: colors.text }}>
      {/* -------- Header -------- */}
      <header className="relative px-4 py-4 flex items-center justify-between text-white shadow-md shadow-black/30">
        {/* Gradient + Golden Glow */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'linear-gradient(90deg, #3A0000 0%, #803030 50%, #D4A77A 100%)',
            boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
          }}
        />
        {/* Left: Title */}
        <div className="flex items-center gap-4">
          <button
            onClick={handleLogoClick}
            className="relative z-10 flex items-center justify-center hover:opacity-70 transition"
            title="Go to dashboard"
          >
            <ArrowLeft size={45} strokeWidth={1.8} color="white" />
          </button>

          <button
            onClick={goScheduleHome}
            className={`font-extrabold leading-none text-lg md:text-lg ${
              isHeaderActive || page == 'staff-schedule'
                ? 'text-white relative after:content-[""] after:block after:w-[85%] after:mx-auto after:h-[3px] after:rounded-full after:bg-white after:mt-2 after:transition-all after:duration-200 text-center px-3 py-2'
                : 'text-white text-center relative hover:after:content-[""] hover:after:block hover:after:w-[85%] hover:after:mx-auto hover:after:h-[3px] hover:after:rounded-full hover:bg-transparent hover:after:bg-white/70 hover:after:mt-2 hover:transition-all hover:duration-200 px-3 py-2 transition'
            }`}
          >
            {/* Header Title */}
            <span className="hidden lg:flex items-center gap-2 font-extrabold text-white text-lg px-2 text-left">
              {isFamily ? (
                <>
                  <UserSearch
                    className="w-15 h-15 text-white"
                    strokeWidth={1.3}
                  />
                  My PWSN
                </>
              ) : (
                <>
                  <UserSearch
                    className="w-15 h-15 text-white"
                    strokeWidth={1.3}
                  />
                  Client List
                </>
              )}
            </span>
          </button>
        </div>

        {/* Center: Nav */}
        <nav className="hidden lg:flex items-center gap-6 font-extrabold text-white text-lg px-2">
          {safeNavItems.length > 0 ? (
            // Custom nav (already role-filtered)
            <>
              {safeNavItems.map((item) => {
                const active =
                  pathname === item.href ||
                  pathname.startsWith(item.href + '/');
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={
                      active
                        ? 'bg-white/20 underline underline-offset-4'
                        : 'hover:bg-white/10 hover:underline'
                    }
                  >
                    {item.label}
                  </Link>
                );
              })}
            </>
          ) : page === 'staff-schedule' ? null : (
            // Default nav
            <>
              <Link
                href={ROUTES.schedule}
                className={`${activeUnderline(page, 'client-schedule', role!)} inline-flex items-center gap-2 text-left`}
              >
                <Contact className="w-15 h-15 text-white" strokeWidth={1.3} />
                Care Schedule
              </Link>

              {isFamily && (
                <Link
                  href={
                    activeClient.id
                      ? ROUTES.organisationAccess(activeClient.id)
                      : '#'
                  }
                  className={`${
                    activeClient.id
                      ? activeUnderline(page, 'organisation-access', role!)
                      : 'cursor-not-allowed opacity-50'
                  } inline-flex items-center gap-2 text-left`}
                  onClick={(e) => {
                    if (!activeClient.id) e.preventDefault();
                  }}
                >
                  <HouseHeart
                    className="w-15 h-15 text-white"
                    strokeWidth={1.3}
                  />
                  PWSN Service Provider
                </Link>
              )}

              <Link
                href={ROUTES.budget}
                className={`${activeUnderline(page, 'budget', role!)} inline-flex items-center gap-2 text-left`}
              >
                <FileText className="w-15 h-15 text-white" strokeWidth={1.3} />
                Budget Report
              </Link>
              <Link
                href={ROUTES.transactions}
                className={`${activeUnderline(page, 'transactions', role!)} inline-flex items-center gap-2 text-left`}
              >
                <Receipt className="w-15 h-15 text-white" strokeWidth={1.3} />
                View Transactions
              </Link>

              {isManagement && (
                <>
                  <div className="relative">
                    <details className="group">
                      <summary
                        className={`inline-flex items-center gap-2 list-none cursor-pointer ${activeUnderline(page, 'care', role!)} text-left`}
                      >
                        <SquareCheckBig
                          className="w-15 h-15 text-white"
                          strokeWidth={1.3}
                        />
                        Care Items{' '}
                        <span className="text-white/90">
                          <ChevronDown className="w-5 h-5 text-white" />
                        </span>
                      </summary>
                      <div className="absolute left-1/2 -translate-x-1/2 mt-3 w-80 rounded-md border border-white/30 bg-white text-black shadow-2xl z-50">
                        <Link
                          href={ROUTES.careAdd}
                          className="block w-full flex items-center gap-2 text-left px-5 py-4 text-xl font-semibold hover:bg-black/5"
                        >
                          <SquarePlus className="w-9 h-9" strokeWidth={1.3} />
                          Add Care Item
                        </Link>
                        <Link
                          href={ROUTES.careEdit}
                          className="block w-full flex items-center gap-2 text-left px-5 py-4 text-xl font-semibold hover:bg-black/5"
                        >
                          <Settings2 className="w-9 h-9" strokeWidth={1.3} />
                          Edit Care Item
                        </Link>
                      </div>
                    </details>
                  </div>
                </>
              )}
              <Link
                href={ROUTES.requestLog}
                className={`${activeUnderline(page, 'request-log', role!)} inline-flex items-center gap-2 text-left`}
              >
                <ClipboardList
                  className="w-15 h-15 text-white"
                  strokeWidth={1.3}
                />
                Family Requests
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
                className="h-16 w-16 rounded-full flex items-center justify-center overflow-hidden
           border-2 border-white/70 hover:shadow-[0_0_0_3px_rgba(249,201,177,0.7)] transition-all duration-200"
                style={{ backgroundColor: 'white' }}
                aria-haspopup="menu"
                aria-expanded={userMenuOpen}
                title="Account"
              >
                {user?.profilePic ? (
                  <Image
                    src={user.profilePic}
                    alt="User profile"
                    fill
                    className="object-cover rounded-full"
                  />
                ) : (
                  <User
                    size={50}
                    strokeWidth={0.3}
                    fill={palette.header}
                    color={palette.header}
                  />
                )}
              </button>
              {userMenuOpen && (
                <div
                  className="absolute right-0 mt-2 w-60 bg-white border border-gray-200 rounded-xl shadow-lg z-50"
                  role="menu"
                >
                  <button
                    className="w-full px-4 py-3 flex items-center gap-2 font-extrabold hover:bg-gray-50 rounded-lg"
                    style={{ color: palette.header }}
                    onClick={goProfile}
                  >
                    <User size={30} strokeWidth={2} color={palette.header} />
                    Manage your account
                  </button>
                  <button
                    className="w-full px-4 py-3 flex items-center gap-2 font-extrabold hover:bg-gray-50 rounded-lg"
                    style={{ color: palette.header }}
                    onClick={doSignOut}
                  >
                    <LogOut size={30} strokeWidth={2} color={palette.header} />
                    Log out
                  </button>
                </div>
              )}
            </div>
          )}
          {topRight}
        </div>
      </header>

      {/* -------- Pink banner (Client dropdown on the LEFT; now visible for ALL roles) -------- */}
      {shouldShowBanner && (
        <div className="relative isolate px-4 md:px-8 py-2 md:py-4 grid grid-cols-[auto_1fr_auto] items-center shadow-sm shadow-black/20">
          <div
            className="absolute inset-0 z-0 pointer-events-none"
            style={{ backgroundColor: hexToRgba(palette.banner, 0.8) }}
            aria-hidden
          />
          {/* Left: Client picker (ALWAYS visible unless explicitly hidden by prop) */}
          {pickerVisible ? (
            <div className="relative justify-self-start z-10 flex items-center gap-2">
              <label className="sr-only">Select Client</label>
              <select
                className="appearance-none h-10 w-50 md:w-64 pl-8 pr-12 rounded-2xl border border-black/30 hover:border-black/50 bg-white font-extrabold text-xl shadow-sm focus:outline-none"
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
                <ChevronDown className="w-5 h-5 text-black/70" />
              </span>
            </div>
          ) : (
            <div className="h-12 w-56 md:w-64" aria-hidden />
          )}

          {/* Center: Banner title (with avatar) */}
          <div className="relative z-10">
            {computedBannerTitle ? (
              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
                <div className="flex items-center gap-3 justify-center">
                  <h1 className="font-extrabold leading-none text-2xl md:text-3xl select-none whitespace-nowrap">
                    {computedBannerTitle}
                  </h1>

                  {activeClient.id && (
                    <div className="ml-6 pl-6 border-l border-black/20 hidden md:block">
                      <AccessDropdown clientId={activeClient.id} />
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="h-10" />
            )}
          </div>

          {/* Right: Print button (management on client-schedule) */}
          <div className="relative z-10 justify-self-end">
            {page === 'client-schedule' && (
              <button
                onClick={handlePrint}
                className="relative z-20 inline-flex items-center gap-2 px-4 py-2 rounded-2xl border border-black/30 hover:border-black/50 bg-white font-extrabold text-xl"
                title="Print"
              >
                <Printer size={24} />
                Print
              </button>
            )}
          </div>
        </div>
      )}

      {/* -------- Content -------- */}
      <main className="flex-1 min-h-0 overflow-visible">{children}</main>
    </div>
  );
}
