'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';

const COLORS = {
  header: '#3d0000',
  headerSep: '#f3d9c9',
  panel: '#3d0000',
  pageBg: '#fff4e6',
  textDark: '#3d0000',
};

export default function ManagementProfilePage() {
  const [email, setEmail] = useState('');
  const [pwd, setPwd] = useState('');

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log({ email, pwd });
  };

  return (
    <main className="min-h-screen" style={{ background: COLORS.pageBg }}>
      {/* Header */}
      <header
        className="flex items-center justify-between px-6 py-3"
        style={{ background: COLORS.header, color: 'white' }}
      >
        <div className="flex items-center gap-8">
          {/* Logo → back to empty dashboard */}
          <Link href="/management_empty_dashboard" className="shrink-0">
            <Image
              src="/dashboardLogo.png"
              alt="Dashboard Logo"
              width={60}
              height={60}
              className="cursor-pointer"
              priority
            />
          </Link>

          <span className="font-semibold text-lg">Management Dashboard</span>

          <span className="hover:underline cursor-default">
            Client Schedule
          </span>
          <Link
            href="/management_dashboard/carer-schedule"
            className="hover:underline"
          >
            Staff Schedule
          </Link>
        </div>

        <div
          className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center"
          title="Profile"
        >
          <span>👤</span>
        </div>
      </header>

      <div style={{ background: COLORS.headerSep, height: 10 }} />

      <div
        className="px-6 py-3 text-white text-xl font-semibold"
        style={{ background: COLORS.panel }}
      >
        Update your details
      </div>

      {/* Content */}
      <section className="px-6 py-8">
        <form
          onSubmit={onSubmit}
          className="mx-auto w-full max-w-xl bg-transparent"
        >
          <div className="grid grid-cols-1 sm:grid-cols-3 items-center gap-4 sm:gap-6 py-2">
            <label className="justify-self-end font-semibold text-lg text-black sm:text-base">
              Change email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="sm:col-span-2 w-full border border-gray-400 rounded bg-white px-3 py-2"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 items-center gap-4 sm:gap-6 py-2">
            <label className="justify-self-end font-semibold text-lg text-black sm:text-base">
              Change password
            </label>
            <input
              type="password"
              value={pwd}
              onChange={(e) => setPwd(e.target.value)}
              className="sm:col-span-2 w-full border border-gray-400 rounded bg-white px-3 py-2"
            />
          </div>

          {/* Buttons */}
          <div className="flex items-center gap-5 mt-8 justify-center">
            <Link
              href="/management_empty_dashboard"
              className="bg-[#d7c2b7] text-black/90 px-8 py-2 rounded-full font-semibold shadow-sm hover:brightness-95"
            >
              Cancel
            </Link>
            <button
              type="submit"
              className="bg-[#3d0000] text-white px-8 py-2 rounded-full font-semibold shadow-sm hover:brightness-110"
            >
              Save
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}
