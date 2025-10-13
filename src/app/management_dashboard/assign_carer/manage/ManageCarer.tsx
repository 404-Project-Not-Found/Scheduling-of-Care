'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import DashboardChrome from '@/components/top_menu/client_schedule';

const colors = {
  header: '#3A0000',
  pageBg: '#FAEBDC',
  text: '#2b2b2b',
};

function BellIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="shrink-0"
    >
      <path
        d="M12 22a2.5 2.5 0 0 0 2.45-2h-4.9A2.5 2.5 0 0 0 12 22Zm7-6v-4.5a7 7 0 1 0-14 0V16l-2 2v1h18v-1l-2-2Z"
        fill={colors.header}
      />
    </svg>
  );
}

export default function ManageCarerPage() {
  const router = useRouter();

  return (
    <DashboardChrome
      page="assign-carer"
      headerTitle="Staff Schedule"
      bannerTitle=""
      showClientPicker={false}
      navItems={[
        { label: 'Staff List', href: '/management_dashboard/staff_list' },
        {
          label: 'Assign Carer',
          href: '/management_dashboard/assign_carer/manage',
        },
      ]}
      colors={{
        header: colors.header,
        banner: colors.pageBg,
        text: colors.text,
      }}
    >
      {/* Hide the print button */}
      <style>{`button:has(> span:contains("Print")){display:none!important;}`}</style>

      {/* Page body */}
      <div
        className="min-h-[calc(100vh-120px)] flex flex-col"
        style={{ background: colors.pageBg }}
      >
        {/* === GAP between top global header and maroon header === */}
        <div className="h-5" style={{ background: colors.pageBg }} />

        {/* === GAP between top global header and maroon header === */}
        <div className="h-5" style={{ background: colors.pageBg }} />

        {/* === GAP between top global header and maroon header === */}
        <div className="h-5" style={{ background: colors.pageBg }} />

        {/* === Maroon Header === */}
        <div className="w-full" style={{ background: colors.header }}>
          <div className="mx-auto max-w-[1100px] px-6 py-4">
            <h1 className="text-white text-2xl font-extrabold text-left">
              Assign Carer to a Client
            </h1>
          </div>
        </div>

        {/* === Pink Banner (separate now) === */}
        <div className="w-full" style={{ background: '#F9C9B1' }}>
          <div className="mx-auto max-w-[1100px] px-6 md:px-8 py-5 md:py-6 flex items-start gap-3">
            <BellIcon />
            <p
              className="text-base md:text-lg leading-relaxed"
              style={{ color: colors.header }}
            >
              A carer can only be assigned to one client. If you select a new
              client for the carer to be assigned to, the carer will no longer
              have access to their previous client’s care schedule.
            </p>
          </div>
        </div>
        {/* Centered Content */}
        <div className="flex-1 flex flex-col items-center justify-center px-6 py-10 text-center">
          <section className="w-full max-w-[600px] flex flex-col items-center">
            <div className="text-black w-full flex flex-col items-center">
              <p className="mb-6 text-lg">
                <span className="font-semibold">Currently Assigned to:</span>{' '}
                <span className="text-black/80">Florence Edwards</span>
              </p>

              {/* Label + dropdown inline */}
              <div className="flex items-center justify-center gap-4 mb-8">
                <label className="font-semibold text-black">Client:</label>
                <select
                  className="h-11 w-56 rounded-md border px-3 bg-white text-black"
                  style={{ borderColor: '#3A000044' }}
                  defaultValue=""
                >
                  <option value="" disabled>
                    Select Client
                  </option>
                  <option value="c1">Jane Smith</option>
                  <option value="c2">John Brown</option>
                </select>
              </div>

              <div className="flex items-center justify-center gap-4 mb-8">
                <button
                  onClick={() => router.back()}
                  className="px-6 py-2 rounded-md border text-black font-medium hover:bg-black/5"
                  style={{ borderColor: '#3A000044' }}
                >
                  Cancel
                </button>
                <button
                  onClick={() => {}}
                  className="px-6 py-2 rounded-md text-white font-semibold"
                  style={{ background: colors.header }}
                >
                  Assign
                </button>
              </div>
            </div>
          </section>
        </div>
      </div>
    </DashboardChrome>
  );
}
