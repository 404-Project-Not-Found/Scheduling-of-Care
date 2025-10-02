'use client';

import React, { Suspense, useMemo, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import DashboardChrome from '@/components/top_menu/client_schedule';
import { useTransactions } from '@/context/TransactionContext';

import {
  getClientsFE,
  readActiveClientFromStorage,
  writeActiveClientToStorage,
  type Client as ApiClient,
} from '@/lib/mockApi';

// ---- role helpers ----
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

const colors = {
  header: '#3A0000',
  banner: '#F9C9B1',
  text: '#000000',
  pageBg: '#ffd9b3',
  cardBg: '#fff4e6',
  orange: '#f6a56f',
  help: '#ed5f4f',
};

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

/* ================= Inner ================= */
function TransactionHistoryInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { transactions } = useTransactions();

  const role = useMemo<Role>(() => getActiveRole(), []);
  const isCarer = role === 'carer';
  const isFamily = role === 'family';

  // ===== Clients (for DashboardChrome) =====
  const [clients, setClients] = useState<{ id: string; name: string }[]>([]);
  const [activeClientId, setActiveClientId] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState<string>('');

  useEffect(() => {
    (async () => {
      try {
        const list = await getClientsFE();
        const mapped = list.map((c: ApiClient) => ({ id: c._id, name: c.name }));
        setClients(mapped);

        const { id, name } = readActiveClientFromStorage();
        if (id) {
          setActiveClientId(id);
          setDisplayName(name || mapped.find(m => m.id === id)?.name || '');
        }
      } catch {
        setClients([]);
      }
    })();
  }, []);

  const onClientChange = (id: string) => {
    if (!id) {
      setActiveClientId(null);
      setDisplayName('');
      writeActiveClientToStorage('', '');
      return;
    }
    const c = clients.find((x) => x.id === id);
    const name = c?.name || '';
    setActiveClientId(id);
    setDisplayName(name);
    writeActiveClientToStorage(id, name);
  };

  // ===== Local UI State =====
  const [search, setSearch] = useState('');
  const [showHelp, setShowHelp] = useState(false);

  const filtered = transactions.filter(
    (t) =>
      t.type.toLowerCase().includes(search.toLowerCase()) ||
      t.date.includes(search) ||
      t.madeBy.toLowerCase().includes(search.toLowerCase()) ||
      t.items.some((i) => i.toLowerCase().includes(search.toLowerCase()))
  );

  // Add-to-task handler (only for carers)
  const handleAddToTask = (receiptFileName: string) => {
    if (!isCarer) return;
    router.push(`/carer_dashboard?addedFile=${encodeURIComponent(receiptFileName)}`);
  };

  return (
    <DashboardChrome
      page="transactions"
      clients={clients}
      activeClientId={activeClientId}
      onClientChange={onClientChange}
      activeClientName={displayName}
      colors={colors}
      onLogoClick={() => router.push('/empty_dashboard')}
    >
      {/* Main content */}
      <div className="flex-1 h-full bg-[#F8CBA6]/40 overflow-auto">
        <div className="w-full h-full px-6 py-6">
          <div className="w-full rounded-2xl shadow-lg overflow-hidden relative bg-white">
            
            {/* Header */}
            <div className="flex items-center justify-between px-8 py-6" style={{ backgroundColor: colors.header }}>
              <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                Transaction History
              </h1>

              <div className="flex items-center gap-3">
                {/* Add new transaction (only for carer) */}
                {isCarer && (
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
            <div className="px-8 py-8 min-h-[400px] bg-white">
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
                            <div key={idx} className="flex items-center justify-between gap-2">
                              <span>{item}</span>
                              {/* Add-to-task only for carer */}
                              {isCarer && (
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
                {isFamily ? (
                  <>
                    <li>This page is read-only for family accounts.</li>
                    <li>Use Back to Dashboard to return to the selected person’s dashboard.</li>
                  </>
                ) : (
                  <>
                    <li>Click 'Add new transaction' to record a new purchase or refund (carers only).</li>
                    <li>Use 'Add to Task' to link receipts/items to tasks in the dashboard (carers only).</li>
                  </>
                )}
                <li>Transactions are displayed in a table showing type, date, made by, receipt, and associated care items.</li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </DashboardChrome>
  );
}
