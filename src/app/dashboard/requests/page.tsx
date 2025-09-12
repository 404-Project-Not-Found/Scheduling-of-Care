"use client";

import Link from "next/link";
import { useState } from "react";
import Badge from "@/components/Badge";


export default function RequestsPage() {
  const [q, setQ] = useState("");

  return (
    <main>
      <div className="min-h-screen bg-[#F7ECD9]">
        {/* HEADER */}
        <header className="bg-[#3d0000] text-white px-6 py-4 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="inline-flex h-8 w-8 rounded-full bg-white/15 items-center justify-center"
              aria-label="Back to dashboard"
            >
              ←
            </Link>
            <h1 className="text-xl font-semibold">Request Log</h1>
          </div>

          {/* Search */}
          <div className="flex gap-3">
            <div className="relative">
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search"
                aria-label="Search requests"
                className="h-9 w-56 rounded-full bg-white/95 text-black px-4"
              />
            </div>

          </div>
        </header>

        {/* BODY */}
        <section className="px-6 py-6 relative">
          {/* Alert strip */}
          <div className="mb-4 flex items-center gap-2 rounded-lg bg-[#fde7e4] text-[#9b2c2c] px-4 py-2">
            <span className="text-lg leading-none">🔔</span>
            <p className="text-sm text-base">
              You requested a change on the <b>28<sup>th</sup> June 2025</b>
            </p>
          </div>

          {/* Table Card */}
          <div className="rounded-xl border border-black overflow-hidden bg-white">
            <div className="px-4 py-3 border-b bg-[#fff8f0] text-black">
              <div className="font-semibold">Requests</div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="text-gray-600">
                  <tr>
                    <th className="px-4 py-3">Task</th>
                    <th className="px-4 py-3">Requested Change</th>
                    <th className="px-4 py-3">Requested By</th>
                    <th className="px-4 py-3">Date Requested</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Resolution Date</th>
                  </tr>
                </thead>

                <tbody className="divide-y">
                  <tr className="px-4 align-top text-black">
                    <td className="whitespace-nowrap px-4 py-3">Replace Toothbrush Head</td>
                    <td className="px-4 py-3">Change frequency to every 2 months</td>
                    <td className="whitespace-nowrap px-4 py-3">John (Family)</td>
                    <td className="whitespace-nowrap px-4 py-3">28<sup>th</sup> June 2025</td>
                    <td className="px-4 py-3"><Badge tone="yellow">Pending</Badge></td>
                    <td className="whitespace-nowrap px-4 py-3">—</td>
                  </tr>

                  <tr className="align-top text-black">
                    <td className="whitespace-nowrap px-4 py-3">Dental Appointments</td>
                    <td className="px-4 py-3">Add an oral cancer screening appointment on the 6<sup>th</sup> June 2025</td>
                    <td className="whitespace-nowrap px-4 py-3">Mary (POA)</td>
                    <td className="whitespace-nowrap px-4 py-3">19<sup>th</sup> May 2025</td>
                    <td className="px-4 py-3"><Badge tone="green">Approved</Badge></td>
                    <td className="whitespace-nowrap px-4 py-3">25<sup>th</sup> May 2025</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Floating help ? bottom-right */}
          <Link
            href="/help"
            aria-label="Help"
            className="fixed bottom-6 right-6 inline-flex items-center justify-center h-9 w-9 rounded-full bg-[#E37E72] text-white"
          >
            ?
          </Link>
        </section>
      </div>
    </main>
  );
}
