'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';

type CareItem = {
  id: string;
  name: string;
  startDate: string;
  category?: string;
  frequencyValue?: number;
  frequencyUnit?: 'day' | 'week' | 'month' | 'year';
};

export default function RemoveTaskSearchPage() {
  const [query, setQuery] = useState('');
  const [careItems, setCareItems] = useState<CareItem[]>([]);

  useEffect(() => {
    const stored: CareItem[] = JSON.parse(
      localStorage.getItem('careItems') || '[]'
    );
    setCareItems(stored);
  }, []);

  const all = useMemo(
    () => careItems.map((c) => ({ id: c.id, label: c.name })),
    [careItems]
  );

  const filtered = all.filter((t) =>
    t.label.toLowerCase().includes(query.toLowerCase().trim())
  );

  return (
    <main className="min-h-screen flex items-start justify-center p-6">
      <div className="bg-[#fff4e6] rounded-2xl shadow-md w-full max-w-2xl border">
        {/* Maroon header */}
        <h1 className="text-xl font-semibold px-6 py-4 bg-[#3d0000] text-white rounded-t-2xl">
          Remove task
        </h1>

        <div className="p-6">
          {/* Search */}
          <div className="flex gap-3">
            <input
              placeholder="Search for task"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="flex-1 px-4 py-2 border rounded text-black"
            />
          </div>

          {/* Results */}
          <div className="mt-4 space-y-2 text-black">
            {filtered.map((t) => (
              <Link
                key={t.id}
                href={`/dashboard/remove-task/${t.id}`}
                className="block px-4 py-3 rounded-md border bg-gray-100 hover:bg-gray-200"
              >
                {t.label}
              </Link>
            ))}

            {filtered.length === 0 && (
              <p className="text-gray-500">No tasks match your search.</p>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
