/**
 * Filename: /management_dashboard/staff_list/page.tsx
 * Author: Denise Alexander
 * Date Created: 26/09/2025
 */

'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';

// Type definition for a staff object
type Staff = {
  _id: string;
  name: string;
  email?: string;
  avatarUrl?: string;
  role?: 'management' | 'carer';
  status?: 'active' | 'inactive';
};

// Converts unknown errors to a readbale string
function getErrorMessage(err: unknown) {
  if (err instanceof Error) return err.message;
  try {
    return JSON.stringify(err);
  } catch {
    return String(err);
  }
}

export default function StaffListPage() {
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(true);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Fetches the list of staff
  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        const res = await fetch('/api/v1/management/staff', {
          cache: 'no-store',
        });
        if (!res.ok) throw new Error(`Failed to load staff (${res.status})`);
        const data = (await res.json()) as Staff[];
        if (alive) setStaff(data);
      } catch (err: unknown) {
        if (alive) setError(getErrorMessage(err));
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  // Search query: filters by name or email (case-insensitive)
  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return staff;
    return staff.filter(
      (s) =>
        s.name.toLowerCase().includes(term) ||
        (s.email?.toLowerCase().includes(term) ?? false)
    );
  }, [q, staff]);

  return (
    <main className="min-h-screen p-6">
      <div className="max-w-3xl mx-auto bg-[#fff4e6]  rounded-2xl p-6">
        <h1 className="text-xl font-semibold text-[#3d0000] mb-4">Staff</h1>

        <input
          type="text"
          placeholder="Search staff..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="w-full border rounded-lg text-black px-4 py-2 mb-6"
        />

        <div className="flex justify-end gap-4 mb-6">
          <Link
            href="/management_dashboard/add_staff"
            className="px-4 py-2 bg-[#3d0000] text-white rounded"
          >
            Add new staff
          </Link>
          <Link
            href="/empty_dashboard"
            className="px-4 py-2 bg-gray-300 text-black rounded"
          >
            Back to dashboard
          </Link>
        </div>

        {loading && <p className="text-sm text-gray-600">Loading</p>}
        {error && <p className="text-sm text-red-600">{error}</p>}

        {!loading && !error && (
          <ul className="divide-y">
            {filtered.map((s) => (
              <li
                key={s._id}
                className="py-3 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  {s.avatarUrl ? (
                    <Image
                      src={s.avatarUrl}
                      alt={s.name}
                      width={32}
                      height={32}
                      className="h-8 w-8 rounded-full object-cover"
                    />
                  ) : (
                    <div className="h-8 w-8 rounded-full bg-gray-200" />
                  )}
                  <div>
                    {s.name && (
                      <p className="font-medium text-black">{s.name}</p>
                    )}
                    {s.email && (
                      <p className="text-xs text-gray-500">{s.email}</p>
                    )}
                    {s.role && (
                      <p className="text-xs text-gray-500">Role: {s.role}</p>
                    )}
                    {s.status && (
                      <p
                        className={`text-xs font-semibold ${
                          s.status === 'inactive'
                            ? 'text-orange-600'
                            : 'text-green-600'
                        }`}
                      >
                        Status: {s.status}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex gap-2">
                  {/* <Link
                    href={`/management_dashboard/staff${s._id}`}
                    className="px-3 py-1 rounded bg-white text-black hover:bg-gray-300 text-sm"
                  >
                    Assign Carer
                  </Link> */}
                </div>
              </li>
            ))}
            {filtered.length === 0 && (
              <li className="py-4 text-sm text-gray-600">No staff found.</li>
            )}
          </ul>
        )}
      </div>
    </main>
  );
}
