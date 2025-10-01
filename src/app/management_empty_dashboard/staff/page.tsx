'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import { Info } from 'lucide-react';

const C = {
  header: '#3d0000',
  headerSep: '#f3d9c9',
  pageBg: '#efe1cf',
  panel: '#3d0000',
  noteBg: '#f7d1b6',
  noteIcon: '#5a1a1a',
  textDark: '#3d0000',
};

export default function StaffSchedulePage() {
  const [code, setCode] = useState('');

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Register client with code:', code);
  };

  return (
    <main className="min-h-screen" style={{ background: C.pageBg }}>
      <header
        className="flex items-center justify-between px-6 py-3"
        style={{ background: C.header, color: 'white' }}
      >
        <div className="flex items-center gap-8">
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

          <span className="font-semibold text-lg">Staff Schedule</span>

          <span>Staff List</span>
          <span>Assign Carer</span>
        </div>

        <Link
          href="/management_empty_dashboard/profile"
          className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30"
          title="Profile"
        >
          <span>👤</span>
        </Link>
      </header>

      <div style={{ background: C.headerSep, height: 10 }} />

      <div
        className="px-6 py-3 text-white text-xl font-semibold"
        style={{ background: C.panel }}
      >
        Register client with access code
      </div>

      {/* Notice */}
      <div
        className="flex items-start gap-3 px-6 py-3 text-sm"
        style={{ background: C.noteBg, color: C.textDark }}
      >
        <Info size={20} color={C.noteIcon} />

        <p className="leading-relaxed">
          Please request a client access code from the family member in charge
          of the client’s account to register a new client.
        </p>
      </div>

      {/* Form */}
      <section className="px-6 py-10">
        <form
          onSubmit={onSubmit}
          className="mx-auto w-full max-w-3xl bg-transparent"
        >
          <div className="grid grid-cols-1 sm:grid-cols-3 items-center gap-4 sm:gap-6 py-2">
            <label className="justify-self-end font-semibold text-lg text-black sm:text-base">
              Client Access Code
            </label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="sm:col-span-2 w-ful max-w-xs border text-black border-gray-400 rounded bg-white px-3 py-2"
              placeholder="Enter access code"
            />
          </div>

          <div className="flex items-center gap-5 mt-10 justify-center">
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
              Register
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}
