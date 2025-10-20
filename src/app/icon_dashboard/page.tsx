/**
 * File path: /icon_dashboard/page.tsx
 * Authors: Denise Alexander & Devni Wijesinghe
 * Function: Role-aware schedule dashboard that shows different actions per role.
 */

'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { getSession } from 'next-auth/react';
import { getViewerRoleFE } from '@/lib/mock/mockApi';
import {
  CalendarDays,
  Users,
  FileText,
  Receipt,
  ClipboardList,
  HelpCircle,
  User,
  LogOut,
  Info,
  Contact,
} from 'lucide-react';

const palette = {
  header: '#3A0000',
  banner: '#E2C4A8',
  text: '#2b2b2b',
  white: '#FFFFFF',
  pageBg: '#FAEBDC',
};

type Role = 'family' | 'management' | 'carer' | null;
type StrictRole = Exclude<Role, null>;

type ButtonDef = {
  label: string;
  icon: React.ElementType;
  href: string;
};

const BUTTONS: ButtonDef[] = [
  {
    label: 'Client Schedule',
    icon: CalendarDays,
    href: '/calendar_dashboard',
  },
  {
    label: 'Staff Schedule',
    icon: Users,
    href: '/management_dashboard/staff_schedule',
  },
  {
    label: 'Budget Reports',
    icon: FileText,
    href: '/calendar_dashboard/budget_report',
  },
  {
    label: 'Transactions',
    icon: Receipt,
    href: '/calendar_dashboard/transaction_history',
  },
  {
    label: 'Family Requests',
    icon: ClipboardList,
    href: '/request-log-page',
  },
  {
    label: 'FAQ',
    icon: HelpCircle,
    href: '/faq',
  },
];

export default function DashboardPage() {
  const [role, setRole] = useState<Role>(null);
  const [title, setTitle] = useState('Dashboard');
  const router = useRouter();
  const [userName, setUserName] = useState<string>(''); // new

  // Mock flag
  const isMock =
    process.env.NEXT_PUBLIC_ENABLE_MOCK === '1' ||
    process.env.NEXT_PUBLIC_ENABLE_MOCK === 'true';

  useEffect(() => {
    const load = async () => {
      if (isMock) {
        // Try mock role first
        let r = (getViewerRoleFE() as Role) || null;

        // Fallback: infer from lastLoginEmail
        if (!r) {
          const em = (
            localStorage.getItem('lastLoginEmail') || ''
          ).toLowerCase();
          if (em.includes('carer')) r = 'carer';
          else if (em.includes('management')) r = 'management';
          else if (em.includes('family')) r = 'family';
        }

        if (!r) {
          router.replace('/');
          return;
        }

        setRole(r);
        switch (r) {
          case 'family':
            setTitle('Family/POA Dashboard');
            break;
          case 'management':
            setTitle('Management Dashboard');
            break;
          case 'carer':
            setTitle('Carer Dashboard');
            break;
          default:
            setTitle('Dashboard');
        }
        return;
      }

      // Real session role
      const session = await getSession();
      if (!session?.user?.role) {
        router.replace('/');
        return;
      }

      // Get user's name
      if (isMock) {
        // Mock name
        const em = (localStorage.getItem('lastLoginEmail') || '').split('@')[0];
        setUserName(em.charAt(0).toUpperCase() + em.slice(1));
      } else {
        const session = await getSession();
        if (session?.user?.name) {
          setUserName(session.user.name);
        }
      }

      const r = session.user.role as Role;
      setRole(r);
      switch (r) {
        case 'family':
          setTitle('Family/POA Dashboard');
          break;
        case 'management':
          setTitle('Management Dashboard');
          break;
        case 'carer':
          setTitle('Carer Dashboard');
          break;
        default:
          setTitle('Dashboard');
      }
    };
    load();
  }, [router, isMock]);

  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const showAvatar = true;
  const avatarSrc = '/default_profile.png';

  const goProfile = () => {
    setUserMenuOpen(false);
    router.push('/calendar_dashboard/update_details');
  };

  const doSignOut = () => {
    setUserMenuOpen(false);
    router.push('/');
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  // Loading state while role is unknown
  if (!role) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-[#F3E9D9] text-zinc-900">
        <div className="text-center">
          <p className="text-4xl font-extrabold mb-4">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const actions = BUTTONS;

  return (
    <div
      className="min-h-screen w-full flex flex-col"
      style={{ backgroundColor: palette.pageBg }}
    >
      {/* ===== Header ===== */}
      <div
        className="w-full flex items-center justify-between px-8 py-5"
        style={{
          background:
            'linear-gradient(90deg, #3A0000 0%, #803030 60%, #D4A77A 115%)',
          boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
        }}
      >
        {/* Logo + Title */}
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center">
            <Image
              src="/logo.png"
              alt="Logo"
              width={60}
              height={60}
              className="object-contain"
              priority
            />
          </div>
          <h1
            className="text-4xl md:text-4xl font-semibold text-white tracking-tight drop-shadow-md"
            style={{
              fontFamily: `'DM Sans', sans-serif`,
              letterSpacing: '-0.4px',
            }}
          >
            Scheduling of Care
          </h1>
        </div>

        {/* Right: Avatar dropdown */}
        <div className="relative flex items-center gap-4">
          {showAvatar && (
            <div className="relative flex items-center gap-3">
              {/* Avatar Button (anchor for menu) */}
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen((v) => !v)}
                  className="h-16 w-16 rounded-full flex items-center justify-center overflow-hidden border-2 border-white/80 hover:border-black/50 focus:outline-none focus:ring-2 focus:ring-white/70"
                  style={{ backgroundColor: 'white' }}
                  aria-haspopup="menu"
                  aria-expanded={userMenuOpen}
                  title="Account"
                >
                  <User
                    size={50}
                    strokeWidth={0.3}
                    fill={palette.header}
                    color={palette.header}
                  />
                </button>

                {/* Dropdown Menu */}
                {userMenuOpen && (
                  <div
                    className="absolute right-0 top-[calc(100%+0.5rem)] w-60 bg-white border border-gray-200 rounded-xl shadow-lg z-50"
                    role="menu"
                  >
                    <button
                      className="w-full px-4 py-3 flex items-center gap-2 font-extrabold hover:bg-gray-50 rounded-lg text-left"
                      style={{ color: palette.header }}
                      onClick={goProfile}
                    >
                      <User size={24} strokeWidth={2} color={palette.header} />
                      Update your details
                    </button>
                    <button
                      className="w-full px-4 py-3 flex items-center gap-2 font-extrabold hover:bg-gray-50 rounded-lg text-left"
                      style={{ color: palette.header }}
                      onClick={doSignOut}
                    >
                      <LogOut
                        size={24}
                        strokeWidth={2}
                        color={palette.header}
                      />
                      Log out
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <section className="w-full px-12 pt-6 pb-4">
        <h2 className="text-3xl md:text-3xl font-extrabold text-[#3A0000] tracking-tight">
          {getGreeting()}, {userName || 'there'} 👋
        </h2>
        <p className="text-[#3A0000]/80 text-base md:text-lg font-medium mt-1">
          Welcome back to your {title}!
        </p>
        <div className="mt-4 w-325 mx-auto border-t-1 border-[#3A0000]/25 rounded-full"></div>
      </section>

      {/* ===== Main Dashboards ===== */}
      <main className="flex flex-col items-center justify-center w-full px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 w-full max-w-6xl">
          {['Client Schedule', 'Staff Schedule'].map((mainLabel) => {
            const mainAction = actions.find((a) => a.label === mainLabel);
            if (!mainAction) return null;
            const Icon = mainAction.icon;

            return (
              <div
                key={mainLabel}
                onClick={() => router.push(mainAction.href)}
                className="group flex flex-col justify-between text-center 
          bg-white
          rounded-3xl p-10 shadow-md hover:shadow-[0_6px_20px_rgba(58,0,0,0.25)] 
          hover:-translate-y-1 transition-all border border-[#3A0000]/15 cursor-pointer 
          min-h-[340px]"
              >
                <div>
                  <div
                    className="relative inline-flex items-center justify-center w-20 h-20 mx-auto mb-5
              rounded-full bg-[#3A0000]/10 group-hover:bg-[#3A0000]/15 transition"
                  >
                    <Icon className="w-12 h-12 text-[#3A0000] group-hover:scale-110 transition-transform" />
                  </div>
                  <h2 className="text-3xl font-extrabold text-[#3A0000] mb-3 drop-shadow-sm">
                    {mainLabel}
                  </h2>
                  <p className="text-[#3A0000]/90 font-medium text-base mb-6 leading-relaxed">
                    {(() => {
                      if (mainLabel === 'Client Schedule') {
                        if (role === 'management')
                          return 'View and manage all client schedules and care plans.';
                        if (role === 'family')
                          return 'View and manage your loved ones’ care schedules.';
                        if (role === 'carer')
                          return 'Complete assigned care items and track client routines.';
                      } else if (mainLabel === 'Staff Schedule') {
                        if (role === 'management')
                          return 'View and manage all staff members and their shift schedules.';
                        if (role === 'family')
                          return 'View staff schedules involved in your loved one’s care.';
                        if (role === 'carer')
                          return 'View your shifts and the overall staff schedule.';
                      }
                      return '';
                    })()}
                  </p>
                  <span
                    className="relative text-[#3A0000]/80 text-md font-semibold group-hover:text-[#3A0000]
              after:content-[''] after:absolute after:left-1/2 after:-translate-x-1/2 after:bottom-[-3px]
              after:w-0 after:h-[2px] after:rounded-full after:bg-[#3A0000]/70
              group-hover:after:w-[80%] after:transition-all after:duration-300 after:ease-out"
                  >
                    View Schedule →
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </main>

      {/* ===== Main content placeholder ===== */}
      <section className="w-full flex-1">
        <div className="w-full px-6 md:px-10 py-8 md:py-10">
          {/* Add dashboard widgets here if needed */}
        </div>
      </section>
    </div>
  );
}
