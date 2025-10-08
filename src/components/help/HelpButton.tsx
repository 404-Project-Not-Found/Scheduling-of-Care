'use client';

/**
 * Floating Help FAB (role + route aware)
 * ------------------------------------------------------------
 * - Resolve role first, then map the current route to the right FAQ.
 * - Works with both mock and real API through getViewerRole().
 * - Unifies Client Schedule mapping for family / management / carer.
 * - Each role also has a "Main dashboard" (choose Staff vs Client)
 *   and those matchers are placed LAST per your request.
 */

import { useEffect, useMemo, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useHelp } from '@/components/help/HelpPanel';
import type { FAQBook } from '@/components/help/faqData';
import { getViewerRole } from '@/lib/data';

type Role = 'family' | 'carer' | 'management';
type Target = { pageKey: keyof FAQBook; sectionId: string };
type Matcher = (p: string) => Target | null;

/* ------------------------- Role resolution ------------------------- */

function useViewerRoleResolved(pathname: string): Role {
  const [role, setRole] = useState<Role | null>(null);

  // 1) global hint / storage
  useEffect(() => {
    try {
      // @ts-ignore
      const hinted = typeof window !== 'undefined' ? window.__APP_ROLE__ : undefined;
      if (hinted === 'family' || hinted === 'carer' || hinted === 'management') {
        setRole(hinted);
        return;
      }
      if (typeof window !== 'undefined') {
        const s = (
          localStorage.getItem('role') ||
          sessionStorage.getItem('role') ||
          ''
        ).toLowerCase();
        if (s === 'family' || s === 'carer' || s === 'management') {
          setRole(s as Role);
          return;
        }
      }
    } catch {/* ignore */}
  }, []);

  // 2) async (mock/real)
  useEffect(() => {
    if (role) return;
    let alive = true;
    (async () => {
      try {
        const r = await getViewerRole();
        if (!alive) return;
        if (r === 'family' || r === 'carer' || r === 'management') {
          setRole(r);
          try { sessionStorage.setItem('role', r); } catch {}
          try { (window as any).__APP_ROLE__ = r; } catch {}
          return;
        }
      } catch {}
      if (!alive) return;
      setRole(resolveRoleByPath(pathname));
    })();
    return () => { alive = false; };
  }, [pathname, role]);

  return role ?? resolveRoleByPath(pathname);
}

/** Last-resort: infer by path */
function resolveRoleByPath(pathname: string): Role {
  const p = (pathname || '').toLowerCase();

  // Strong management hints
  if (
    p.includes('/management_dashboard') ||
    p.startsWith('/add_staff') ||
    p.startsWith('/assign_carer') ||
    p.startsWith('/clients_list') ||
    p.startsWith('/manage_care_item') ||
    p.startsWith('/register_client') ||
    p.startsWith('/requests') ||
    p.startsWith('/staff_list') ||
    p.startsWith('/old_organisation_access') ||
    p.startsWith('/organisation') ||
    p.startsWith('/partial_dashboard') ||
    p.startsWith('/request-log-page') ||
    p.startsWith('/schedule_dashboard') ||
    p.startsWith('/reset_password') ||
    p.startsWith('/reset_password_link')
  ) return 'management';

  // Family hints
  if (
    p.startsWith('/calendar_dashboard') ||
    p.startsWith('/client_profile') ||
    p.startsWith('/family_dashboard') ||
    p.startsWith('/signup/family') ||
    p.startsWith('/role')
  ) return 'family';

  // Carer catch
  if (p.includes('/carer')) return 'carer';

  return 'family';
}

/* ----------------------- Route → FAQ tables ------------------------ */
/** FAMILY */
const familyMatchers: Matcher[] = [
  // Specific pages first
  (p) =>
    p.startsWith('/calendar_dashboard/budget_report') ||
    p.startsWith('/calendar_dashboard/category-cost')
      ? { pageKey: 'family/budget-report', sectionId: 'family-budget-report' }
      : null,

  (p) =>
    p.startsWith('/calendar_dashboard/transaction_history') ||
    p.startsWith('/calendar_dashboard/add_tran') ||
    p.startsWith('/calendar_dashboard/add_transaction')
      ? { pageKey: 'family/view-transaction', sectionId: 'family-view-transactions' }
      : null,

  (p) =>
    p.startsWith('/client_profile')
      ? { pageKey: 'family/client-profile', sectionId: 'family-client-profile' }
      : null,

  (p) =>
    p.startsWith('/family_dashboard/people_list')
      ? { pageKey: 'family/my-clients', sectionId: 'family-my-clients' }
      : null,

  (p) =>
    p.startsWith('/family_dashboard/manage_organisation_access') ||
    p.startsWith('/family_dashboard/manage_org_access')
      ? { pageKey: 'family/organisation-access', sectionId: 'family-organisation-access' }
      : null,

  (p) =>
    p.startsWith('/family_dashboard/request_of_change_page')
      ? { pageKey: 'family/request-form', sectionId: 'family-request-form' }
      : null,

  (p) =>
    p.startsWith('/signup/family')
      ? { pageKey: 'family/welcome-login', sectionId: 'family-signup' }
      : null,

  (p) =>
    p.startsWith('/role')
      ? { pageKey: 'family/welcome-login', sectionId: 'family-role-select' }
      : null,

  // ↓↓↓ LAST: unified Client Schedule + Main dashboard (fallbacks)
  (p) =>
    p.startsWith('/calendar_dashboard') || p.startsWith('/schedule_dashboard')
      ? { pageKey: 'family/client-schedule', sectionId: 'family-client-schedule' }
      : null,

  (p) =>
    p.startsWith('/family_dashboard')
      ? { pageKey: 'family/dashboard', sectionId: 'family-dashboard-overview' }
      : null,
];

/** CARER */
const carerMatchers: Matcher[] = [
  // Specific pages first
  (p) =>
    p.includes('/update_details')
      ? { pageKey: 'carer/update-details', sectionId: 'carer-update-details' }
      : null,

  (p) =>
    p.includes('/budget_report') || p.includes('/category-cost')
      ? { pageKey: 'carer/budget-report', sectionId: 'carer-budget-report' }
      : null,

  (p) =>
    p.includes('/transaction_history') || p.includes('/add_tran') || p.includes('/add_transaction')
      ? { pageKey: 'carer/view-transactions', sectionId: 'carer-view-transactions' }
      : null,

  (p) =>
    p.startsWith('/client_profile')
      ? { pageKey: 'carer/client-profile', sectionId: 'carer-client-profile' }
      : null,

  // ↓↓↓ LAST: unified Client Schedule + Main dashboard (carer)
  (p) =>
    p.startsWith('/calendar_dashboard') || p.startsWith('/schedule_dashboard')
      ? { pageKey: 'carer/client-schedule', sectionId: 'carer-client-schedule' }
      : null,

  (p) =>
    p.startsWith('/carer_dashboard') || p.startsWith('/partial_dashboard')
      ? { pageKey: 'carer/dashboard', sectionId: 'carer-dashboard-overview' }
      : null,
];

/** MANAGEMENT */
const managementMatchers: Matcher[] = [
  // Specific pages first
  (p) =>
    p.includes('/add_staff')
      ? { pageKey: 'management/add-staff', sectionId: 'management-add-staff' }
      : null,

  (p) =>
    p.includes('/assign_carer')
      ? { pageKey: 'management/assign-carer', sectionId: 'management-assign-carer' }
      : null,

  (p) =>
    p.includes('/clients_list')
      ? { pageKey: 'management/clients-list', sectionId: 'management-clients-list' }
      : null,

  (p) =>
    p.includes('/staff_list')
      ? { pageKey: 'management/staff-list', sectionId: 'management-staff-list' }
      : null,

  (p) =>
    p.includes('/requests')
      ? { pageKey: 'management/requests', sectionId: 'management-requests' }
      : null,

  (p) =>
    p.includes('/manage_care_item/edit')
      ? { pageKey: 'management/edit-care-items', sectionId: 'edit-care-item' }
      : null,

  (p) =>
    p.includes('/manage_care_item/add')
      ? { pageKey: 'management/add-care-items', sectionId: 'add-care-item' }
      : null,

  (p) =>
    p.includes('/register_client')
      ? { pageKey: 'management/register-client', sectionId: 'management-register-client' }
      : null,

  (p) =>
    p.includes('/old_organisation_access') || p.includes('/organisation')
      ? { pageKey: 'management/organisation', sectionId: 'management-organisation' }
      : null,

  (p) =>
    p.includes('/request-log-page')
      ? { pageKey: 'management/request-log', sectionId: 'management-request-log' }
      : null,

  (p) =>
    p.startsWith('/reset_password') || p.startsWith('/reset_password_link')
      ? { pageKey: 'management/reset-password', sectionId: 'management-reset-password' }
      : null,

  // ↓↓↓ LAST: unified Client Schedule + Main dashboard (fallbacks)
  (p) =>
    p.startsWith('/calendar_dashboard') || p.startsWith('/schedule_dashboard')
      ? { pageKey: 'management/client-schedule', sectionId: 'management-client-schedule' }
      : null,

  (p) =>
    p.startsWith('/management_dashboard') || p.startsWith('/partial_dashboard')
      ? { pageKey: 'management/dashboard', sectionId: 'management-dashboard-overview' }
      : null,
];

/** Role → its matcher list */
function resolveByRoleAndPath(role: Role, pathname: string): Target {
  const p = (pathname || '/').toLowerCase();
  const tables: Record<Role, Matcher[]> = {
    family: familyMatchers,
    carer: carerMatchers,
    management: managementMatchers,
  };

  for (const fn of tables[role]) {
    const hit = fn(p);
    if (hit) return hit;
  }

  // Final safe fallbacks
  switch (role) {
    case 'family':
      return { pageKey: 'family/dashboard', sectionId: 'family-dashboard-overview' };
    case 'carer':
      return { pageKey: 'carer/dashboard', sectionId: 'carer-dashboard-overview' };
    case 'management':
      return { pageKey: 'management/dashboard', sectionId: 'management-dashboard-overview' };
    default:
      return { pageKey: 'family/dashboard', sectionId: 'family-dashboard-overview' };
  }
}

/* ------------------------------ Button ------------------------------ */
export default function FloatingHelpButton() {
  const pathname = usePathname() || '/';
  const role = useViewerRoleResolved(pathname);
  const { open } = useHelp();

  const target = useMemo(() => resolveByRoleAndPath(role, pathname), [role, pathname]);

  return (
    <button
      type="button"
      aria-label="Help"
      title="Help"
      onClick={() => open(target.pageKey, target.sectionId)}
      className="fixed bottom-6 right-6 flex h-12 w-12 items-center justify-center rounded-full bg-[#F08479] text-white text-2xl font-bold shadow-md hover:shadow-lg hover:bg-[#E57266] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
    >
      ?
      <span className="sr-only">Help</span>
    </button>
  );
}
