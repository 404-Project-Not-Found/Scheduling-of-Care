'use client';

import React, { Suspense, useMemo, useState } from 'react';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTransactions } from '@/context/TransactionContext';

const colors = {
  pageBg: '#ffd9b3',
  cardBg: '#fff4e6',
  header: '#3d0000',
  text: '#000000',
  orange: '#f6a56f',
  help: '#ed5f4f',
};

// ---- role helpers (frontend mock only) ----
type Role = 'carer' | 'family' | 'management';

function getActiveRole(): Role {
  if (typeof window === 'undefined') return 'carer';
  const r =
    (localStorage.getItem('activeRole') as Role | null) ||
    (sessionStorage.getItem('mockRole') as Role | null) ||
    'carer';
  return (['carer', 'family', 'management'] as const).includes(r as Role)
    ? (r as Role)
    : 'carer';
}

/** FAMILY back path resolver
 * Priority:
 *  1) URL ?from=full|partial
 *  2) localStorage.lastDashboard ('full' | 'partial')
 *  3) default: /partial_dashboard
 */
function resolveFamilyReturnPath(sp: {
  get: (k: string) => string | null;
}): string {
  const from = sp.get('from');
  if (from === 'full') return '/full_dashboard?viewer=family';
  if (from === 'partial') return '/partial_dashboard';

  if (typeof window !== 'undefined') {
    const last = localStorage.getItem('lastDashboard');
    if (last === 'full') return '/full_dashboard?viewer=family';
    if (last === 'partial') return '/partial_dashboard';
  }
  return '/partial_dashboard';
}

/* ================= Page (Suspense wrapper) ================= */
export default function TransactionHistoryPage() {
  return (
    <Suspense
      fallback={<div className="p-6 text-gray-600">Loading transactions…</div>}
    >
      <TransactionHistoryInner />
    </Suspense>
  );
}

/* ================= Inner (uses useSearchParams) ================= */
function TransactionHistoryInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { transactions } = useTransactions();

  const role = useMemo<Role>(() => getActiveRole(), []);
  const isFamily = role === 'family';

  const [search, setSearch] = useState('');
  const [showHelp, setShowHelp] = useState(false);

  const filtered = transactions.filter(
    (t) =>
      t.type.toLowerCase().includes(search.toLowerCase()) ||
      t.date.includes(search) ||
      t.madeBy.toLowerCase().includes(search.toLowerCase()) ||
      t.items.some((i) => i.toLowerCase().includes(search.toLowerCase()))
  );

  const instructions = [
    'Use the search box to filter transactions by type, date, carer, or items.',
    ...(isFamily
      ? [
          'This page is read-only for family accounts.',
          'Use Back to Dashboard to return to the selected person’s dashboard.',
        ]
      : [
          "Click 'Add new transaction' to record a new purchase or refund.",
          "Use 'Add to Task' to link receipts/items to tasks in the dashboard.",
          'The Back to Dashboard button returns you to the main dashboard page.',
        ]),
    'Transactions are displayed in a table showing type, date, made by, receipt, and associated care items.',
  ];

  // Back button handler
  const handleBack = () => {
    if (isFamily) {
      router.push(resolveFamilyReturnPath(searchParams));
    } else if (role === 'management') {
      router.push('/menu/management');
    } else {
      router.push('/carer_dashboard');
    }
  };

  // Add-to-task handler (hidden for family)
  const handleAddToTask = (receiptFileName: string) => {
    if (isFamily) return;
    router.push(
      `/carer_dashboard?addedFile=${encodeURIComponent(receiptFileName)}`
    );
  };

  return (
    <main
      className="min-h-screen w-full flex flex-col items-center justify-start px-6 py-12 relative"
      style={{ backgroundColor: colors.pageBg }}
    >
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
          {/* Title with Logo */}
          <div className="flex items-center gap-3">
            <Image
              src="/logo.png"
              alt="Scheduling of Care"
              width={40}
              height={40}
              className="object-contain"
              priority
            />
            <h1 className="text-2xl font-bold text-white">
              Transaction History
            </h1>
          </div>

          <div className="flex items-center gap-3">
            {/* Hide "Add new transaction" for family */}
            {!isFamily && (
              <button
                className="px-4 py-2 rounded-lg font-medium"
                style={{ backgroundColor: colors.orange, color: colors.text }}
                onClick={() => router.push('/add_transaction')}
              >
                Add new transaction
              </button>
            )}

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
              {filtered.map((t) => (
                <tr key={t.id} className="border-t">
                  <td className="py-3">{t.type}</td>
                  <td className="py-3">{t.date}</td>
                  <td className="py-3">{t.madeBy}</td>
                  <td className="py-3">{t.receipt}</td>
                  <td className="py-3">
                    <div className="flex flex-col gap-2">
                      {t.items.map((item, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between gap-2"
                        >
                          <span>{item}</span>

                          {/* Hide Add-to-Task for family (read-only) */}
                          {!isFamily && (
                            <button
                              className="px-2 py-1 text-xs bg-[#3d0000] text-white rounded"
                              onClick={() => handleAddToTask(t.receipt)}
                            >
                              Add to Task
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-gray-600">
                    No transactions match your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Help Button */}
      <div
        className="fixed bottom-6 right-6 z-50"
        onMouseEnter={() => setShowHelp(true)}
        onMouseLeave={() => setShowHelp(false)}
      >
        <div className="relative">
          <button
            className="w-10 h-10 rounded-full text-white font-bold text-lg"
            style={{ backgroundColor: colors.help }}
          >
            ?
          </button>

          {showHelp && (
            <div className="absolute bottom-14 right-0 w-80 p-4 bg-white border border-gray-400 rounded shadow-lg text-black text-sm">
              <h3 className="font-bold mb-2">Transaction History Help</h3>
              <ul className="list-disc list-inside space-y-1">
                {instructions.map((instr, idx) => (
                  <li key={idx}>{instr}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Back to Dashboard Button */}
      <div className="fixed bottom-16 left-6 z-50">
        <button
          className="px-6 py-2 rounded-lg font-medium"
          style={{ backgroundColor: colors.orange, color: colors.text }}
          onClick={handleBack}
        >
          Back to Dashboard
        </button>
      </div>
    </main>
  );
}
