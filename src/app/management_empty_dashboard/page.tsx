'use client';

import Link from 'next/link';
import Image from 'next/image';

export default function EmptyDashboard() {
  return (
    <main style={{ background: '#fff4e6' }} className="min-h-screen">
      {/* Navigation bar */}
      <div
        className="flex items-center justify-between px-6 py-3"
        style={{ background: '#3d0000', color: 'white' }}
      >
        <div className="flex items-center gap-8">
          {/* Logo - goes back to dashboard */}
          <Link href="/management_empty_dashboard">
            <Image
              src="/dashboardLogo.png"
              alt="Dashboard Logo"
              width={60}
              height={60}
              className="cursor-pointer"
            />
          </Link>

          <span className="font-semibold text-lg">Management Dashboard</span>

          {/* Links */}
          <span className="hover:underline cursor-default">
            Client Schedule
          </span>
          <Link
            href="/management_empty_dashboard/staff_schedule_calendar"
            className="hover:underline"
          >
            Staff Schedule
          </Link>
        </div>

        <Link
          href="/management_empty_dashboard/profile"
          className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30"
        >
          <span>👤</span>
        </Link>
      </div>

      {/* Info strip */}
      <div
        className="flex items-center gap-2 px-6 py-2 text-sm"
        style={{ background: '#ffe4c4', color: '#3d0000' }}
      >
        <span>🔔</span>
        <span>
          Click <strong>Client Schedule</strong> to select a client, view their
          schedule and manage their care items.
        </span>
      </div>
    </main>
  );
}
