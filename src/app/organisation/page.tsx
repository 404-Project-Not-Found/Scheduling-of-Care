/**
 * File path: /organisation/page.tsx
 * Author: Denise Alexander
 * Date Created: 26/09/2025
 *
 * Purpose: for management staff to decide between adding/joining an organisation when they choose to
 * sign up.
 *
 * Last Updated by Denise Alexander (23/10/2025): Added managemnet sign up instructions as per client's
 * request.
 */

import { Info } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

export default function OrganisationPage() {
  return (
    <div className="min-h-screen w-full bg-[#FAEBDC] text-zinc-900 flex flex-col">
      {/* Logo + Title */}
      <div className="flex items-center gap-4 flex-wrap px-8 pt-8">
        <Image
          src="/logo-name.png"
          alt="Logo"
          width={220}
          height={220}
          className="object-contain"
          priority
        />
      </div>

      <div className="flex-1 flex items-center justify-center">
        <div className="w-full max-w-lg bg-white/80 rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.08)] p-12">
          {/* Page title */}
          <h2 className="text-4xl font-extrabold tracking-tight mb-4 text-center">
            Select One
          </h2>

          {/* Info section */}
          <div className="flex items-start gap-4 bg-[#F9C9B1]/60 border border-[#3A0000]/30 rounded-xl shadow-sm py-4 px-6 mb-10">
            <Info
              size={28}
              strokeWidth={2.5}
              className="text-[#3A0000] flex-shrink-0 mt-1"
            />
            <div className="text-[#3A0000] leading-relaxed">
              <h3 className="text-lg mb-0.5">
                As a <span className="font-extrabold">Management User</span>,
                you can either register a new service provider into the system
                or join a service provider that is already registered into our
                system.
              </h3>
            </div>
          </div>

          {/* Buttons */}
          <div className="space-y-6">
            <Link
              href="/signup?role=management&org=create"
              className="block w-full rounded-full px-10 py-5 text-2xl font-semibold bg-[#4A0A0A] text-white hover:opacity-95 transition text-center"
            >
              Register a new service provider
            </Link>
            <Link
              href="/signup?role=management&org=join"
              className="block w-full rounded-full px-10 py-5 text-2xl font-semibold bg-[#4A0A0A] text-white hover:opacity-95 transition text-center"
            >
              Join an existing service provider
            </Link>
          </div>

          {/* Footer */}
          <p className="mt-12 text-xl text-center">
            Already have an account?{' '}
            <Link
              href="/"
              className="underline underline-offset-4 font-semibold hover:opacity-80"
            >
              Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
