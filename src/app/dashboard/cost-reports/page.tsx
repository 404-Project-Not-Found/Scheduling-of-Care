"use client";

import Link from "next/link";
import { useState } from "react";
import Budget from "@/components/Budgets";
import Badge from "@/components/Badge";



export default function CostReportsPage() {
  const [q, setQ] = useState("");
  const [year, setYear] = useState("2025");

  return (
    <main className="min-h-screen">
      <div className="min-h-screen bg-[#FFF4E6]">
        {/* Header */}
        <header className="bg-[#3d0000] text-white px-5 py-7 flex justify-between sticky top-0 z-10">
          <div className="flex items-center gap-6">
            <Link
              href="/dashboard"
              className="inline-flex h-8 w-8 rounded-full bg-white/15 items-center justify-center"
              aria-label="Back to dashboard"
              title="Back"
            >
              ←
            </Link>
            <h1 className="text-xl font-semibold">Cost Report</h1>
          </div>

          {/* Search */}
          <div className="flex gap-3">
            <div className="relative">
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search"
                aria-label="Search cost report"
                className="h-9 rounded-full bg-white text-black px-4"
              />
            </div>
    
          </div>
        </header>

        {/* Body */}
        <section className="p-5 p-6">
          {/* Select Year */}
          <div className="mb-4 flex gap-2">
            <span className="font-medium text-[#000]">Select year:</span>
            <select
              value={year}
              onChange={(e) => setYear(e.target.value)}
              className="rounded-md bg-white text-black text-sm px-3 py-1 border"
            >
              <option value="2025">2025</option>
              <option value="2024">2024</option>
              <option value="2023">2023</option>
            </select>
            <button
              type="button"
              aria-label="Help"
              className="h-6 w-6 rounded-full bg-[#E37E72] text-white text-xs"
            >
              ?
            </button>
          </div>

          {/* Alert */}
          <div className="mb-4 flex items-center gap-2 rounded-lg bg-[#fde7e4] text-[#9b2c2c] px-4 py-2">
            <span>⚠️</span>
            <p className="text-base">
              Dental Checkup budget exceeded by <b>$36</b>
            </p>
          </div>

          {/* Overview */}
          <div className="grid grid-cols-3 gap-4 mb-6 text-black">
            <Budget title="Total Annual Budget" value="$15,000" />
            <Budget title="Spent to Date" value="$7,800" />
            <Budget title="Remaining Balance" value="$7,200" positive />
          </div>

          {/* Table */}
          <div className="rounded-xl border border-black/10 bg-white text-black">
            <div className="px-4 py-3 border-b bg-[#fff8f0] flex items-center justify-between">
              <div className="font-semibold">Overspent Items: 1</div>
              <div className="text-sm text-black">Year: {year}</div>
            </div>

            <div>
              <table className="w-full text-left text-sm divide-y">
                <thead className="text-gray-600">
                  <tr className="text-black">
                    <th className="px-4 py-3">Item</th>
                    <th className="px-4 py-3">Category</th>
                    <th className="px-4 py-3">Allocated Budget</th>
                    <th className="px-4 py-3">Amount Spent</th>
                    <th className="px-4 py-3">Remaining</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  <tr className="text-black">
                    <td className="px-4 py-3">Dental Appointments</td>
                    <td className="px-4 py-3">Hygiene</td>
                    <td className="px-4 py-3">$600</td>
                    <td className="px-4 py-3">$636</td>
                    <td className="text-red-600">-$36</td>
                    <td>
                      <Badge tone="red">Exceeded</Badge>
                    </td>
                  </tr>
                  <tr className="table-cell-padding text-black">
                    <td className="px-4 py-3">Toothbrush Heads</td>
                    <td className="px-4 py-3">Hygiene</td>
                    <td className="px-4 py-3">$30</td>
                    <td className="px-4 py-3">$28</td>
                    <td className="px-4 py-3">$2</td>
                    <td>
                      <Badge tone="yellow">Nearly Exceeded</Badge>
                    </td>
                  </tr>
                  <tr className="text-black">
                    <td className="px-4 py-3">Socks</td>
                    <td className="px-4 py-3">Clothing</td>
                    <td className="px-4 py-3">$50</td>
                    <td className="px-4 py-3">$36</td>
                    <td className="px-4 py-3">$14</td>
                    <td>
                      <Badge tone="green">Within Limit</Badge>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          
          <div className="mt-6 flex justify-end gap-3">
            <button className="px-5 rounded-full bg-white text-black border">
              Export CSV
            </button>
            <button className="h-10 px-5 rounded-full bg-[#4A0A0A] text-white">
              Print
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}
