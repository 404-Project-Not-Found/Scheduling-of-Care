"use client";

import React, { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useTransactions } from "@/context/TransactionContext";

const colors = {
  pageBg: "#ffd9b3",
  cardBg: "#fff4e6",
  header: "#3d0000",
  text: "#000000",
  orange: "#f6a56f",
  help: "#ed5f4f",
};

export default function TransactionHistoryPage() {
  const router = useRouter();
  const { transactions } = useTransactions();
  const [search, setSearch] = useState("");

  const filtered = transactions.filter(
    (t) =>
      t.type.toLowerCase().includes(search.toLowerCase()) ||
      t.date.includes(search) ||
      t.madeBy.toLowerCase().includes(search.toLowerCase()) ||
      t.items.some((i) => i.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <main
      className="min-h-screen w-full flex flex-col items-center justify-start px-6 py-12 relative"
      style={{ backgroundColor: colors.pageBg }}
    >
      {/* Top-left logo */}
      <div className="absolute top-6 left-6">
        <Image
          src="/logo-name.png"
          alt="Scheduling of Care"
          width={220}
          height={80}
          className="object-contain"
          priority
        />
      </div>

      {/* Back to Dashboard Button */}
      <div className="w-full max-w-6xl mb-6 flex justify-start">
        <button
          className="px-6 py-2 rounded-full font-medium border hover:bg-gray-800"
          style={{ backgroundColor: "black", color: "white" }}
          onClick={() => router.push("/dashboard")}
        >
          Back to Dashboard
        </button>
      </div>

      {/* Card */}
      <div
        className="w-full max-w-6xl rounded-2xl shadow-lg overflow-hidden relative"
        style={{ backgroundColor: colors.cardBg }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-8 py-6"
          style={{ backgroundColor: colors.header }}
        >
          <h1 className="text-2xl font-bold text-white">Transaction History</h1>

          <div className="flex items-center gap-3">
            <button
              className="px-4 py-2 rounded-lg font-medium"
              style={{ backgroundColor: colors.orange, color: colors.text }}
              onClick={() => router.push("/add_transaction")}
            >
              Add new transaction
            </button>

            <input
              type="text"
              placeholder="Search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="px-3 py-2 rounded-md text-black bg-white border border-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-300"
            />
          </div>
        </div>

        {/* Table */}
        <div className="px-8 py-8 min-h-[400px]">
          <table className="w-full text-left text-black">
            <thead>
              <tr>
                <th className="pb-3">Type</th>
                <th className="pb-3">Date</th>
                <th className="pb-3">Made By</th>
                <th className="pb-3">Receipt</th>
                <th className="pb-3">Associated Care Items</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((t, i) => (
                <tr key={i} className="border-t">
                  <td className="py-3">{t.type}</td>
                  <td className="py-3">{t.date}</td>
                  <td className="py-3">{t.madeBy}</td>
                  <td className="py-3">{t.receipt}</td>
                  <td className="py-3">
                    {t.items.map((item, idx) => (
                      <div key={idx}>{item}</div>
                    ))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Help Button - fixed to bottom right of screen */}
      <div className="fixed bottom-6 right-6 z-50">
        <div className="relative group">
          <button
            className="w-10 h-10 rounded-full text-white font-bold text-lg"
            style={{ backgroundColor: colors.help }}
          >
            ?
          </button>
          <div className="absolute hidden group-hover:block bg-white text-black text-sm p-3 rounded shadow w-72 bottom-full mb-4 right-0">
            <p>• Use the search box to filter transactions by type, date, carer, or items.</p>
            <p>• Click &quot;Add new transaction&quot; to record a new transaction.</p>
            <p>• Click &quot;Back to Dashboard&quot; to return to the main dashboard page.</p>
          </div>
        </div>
      </div>
    </main>
  );
}
