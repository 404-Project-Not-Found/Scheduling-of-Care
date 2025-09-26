'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';

// Type definition for a client object
type Client = {
  _id: string;
  name: string;
  accessCode?: string;
  avatarUrl?: string;
  status?: 'pending' | 'approved';
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

export default function ClientListPage() {
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(true);
  const [clients, setClients] = useState<Client[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Fetches the list of clients
  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        const res = await fetch('/api/management/clients', {
          cache: 'no-store',
        });
        if (!res.ok) throw new Error(`Failed to load clients (${res.status})`);
        const data = (await res.json()) as Client[];
        if (alive) setClients(data);
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

  // Search query: filters by name or access code (case-insensitive)
  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return clients;
    return clients.filter(
      (c) =>
        c.name.toLowerCase().includes(term) ||
        (c.accessCode?.toLowerCase().includes(term) ?? false)
    );
  }, [q, clients]);

  return (
    <main className="min-h-screen p-6">
      <div className="max-w-3xl mx-auto bg-[#fff4e6]  rounded-2xl p-6">
        <h1 className="text-xl font-semibold text-[#3d0000] mb-4">Clients</h1>

        <input
          type="text"
          placeholder="Search clients..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="w-full border rounded-lg text-black px-4 py-2 mb-6"
        />

        {loading && <p className="text-sm text-gray-600">Loading</p>}
        {error && <p className="text-sm text-red-600">{error}</p>}

        {!loading && !error && (
          <ul className="divide-y">
            {filtered.map((c) => (
              <li
                key={c._id}
                className="py-3 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  {c.avatarUrl ? (
                    <Image
                      src={c.avatarUrl}
                      alt={c.name}
                      width={32}
                      height={32}
                      className="h-8 w-8 rounded-full object-cover"
                    />
                  ) : (
                    <div className="h-8 w-8 rounded-full bg-gray-200" />
                  )}
                  <div>
                    <p className="font-medium text-black">{c.name}</p>
                    {c.accessCode && (
                      <p className="text-xs text-gray-500">
                        Access code: {c.accessCode}
                      </p>
                    )}
                    {c.status && (
                      <p
                        className={`text-xs font-semibold ${
                          c.status === 'pending'
                            ? 'text-orange-600'
                            : 'text-green-600'
                        }`}
                      >
                        Status: {c.status}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex gap-2">
                  <Link
                    href={`/dashboard/${c._id}`}
                    className="px-3 py-1 rounded bg-white text-black hover:bg-gray-300 text-sm"
                  >
                    View dashboard
                  </Link>
                  {/* <Link
                    href={`/carer/manage?client=${c._id}`}
                    className="px-3 py-1 rounded bg-[#e07a5f] text-black text-sm"
                  >
                    Assign carer
                  </Link> */}
                </div>
              </li>
            ))}
            {filtered.length === 0 && (
              <li className="py-4 text-sm text-gray-600">No clients found.</li>
            )}
          </ul>
        )}

        <div className="flex justify-between mt-6">
          <Link
            href="/management_dashboard/register_client"
            className="px-4 py-2 bg-[#3d0000] text-white rounded"
          >
            Register new client
          </Link>
          <Link
            href="/empty_dashboard"
            className="px-4 py-2 bg-gray-300 text-black rounded"
          >
            Back to dashboard
          </Link>
        </div>
      </div>
    </main>
  );
}
