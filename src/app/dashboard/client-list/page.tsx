"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";

type Client = {
  _id: string;
  fullName: string;
  accessCode?: string;
  avatarUrl?: string;
};

function getErrorMessage(err: unknown) {
  if (err instanceof Error) return err.message;
  try {
    return JSON.stringify(err);
  } catch {
    return String(err);
  }
}

const colors = {
  pageBg: "#ffd9b3", // page background
  cardBg: "#F7ECD9", // card background
  header: "#3A0000", // maroon header
  text: "#2b2b2b",
};

export default function ClientListPage() {
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [clients, setClients] = useState<Client[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch("/api/clients", { cache: "no-store" });
        if (!res.ok) throw new Error(`Failed to load clients (${res.status})`);
        const data = (await res.json()) as Client[];
        if (alive) setClients(data);
      } catch (err) {
        if (alive) setError(getErrorMessage(err));
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return clients;
    return clients.filter(
      (c) =>
        c.fullName.toLowerCase().includes(term) ||
        (c.accessCode?.toLowerCase().includes(term) ?? false)
    );
  }, [q, clients]);

  return (
    <main
      className="min-h-screen w-full flex items-start justify-center px-6 pb-12 pt-28 md:pt-36 relative"
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

      {/* Card */}
      <div
        className="w-full max-w-3xl rounded-2xl shadow-lg overflow-hidden border"
        style={{ backgroundColor: colors.cardBg, borderColor: "#e7d8c4" }}
      >
        {/* Maroon header with centered title */}
        <div
          className="w-full flex items-center justify-center px-6 py-5"
          style={{ backgroundColor: colors.header }}
        >
          <h1 className="text-2xl md:text-3xl font-bold text-white text-center">
            Clients
          </h1>
        </div>

        {/* Body */}
        <div className="px-6 md:px-8 py-6 md:py-8 text-black">
          {/* Search */}
          <input
            type="text"
            placeholder="Search clients..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="w-full bg-white border-2 rounded-md px-4 py-3 focus:outline-none focus:ring-2"
            style={{ borderColor: `${colors.header}55` }}
          />

          {/* Messages */}
          {loading && <p className="mt-4 text-sm text-gray-600">Loading</p>}
          {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

          {/* List */}
          {!loading && !error && (
            <ul className="mt-6 divide-y" style={{ borderColor: "#eadcc8" }}>
              {filtered.map((c) => (
                <li
                  key={c._id}
                  className="py-3 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    {c.avatarUrl ? (
                      <Image
                        src={c.avatarUrl}
                        alt={c.fullName}
                        width={32}
                        height={32}
                        className="h-8 w-8 rounded-full object-cover"
                      />
                    ) : (
                      <div className="h-8 w-8 rounded-full bg-gray-200" />
                    )}
                    <div>
                      <p className="font-medium" style={{ color: colors.text }}>
                        {c.fullName}
                      </p>
                      {c.accessCode && (
                        <p className="text-xs text-gray-500">
                          Access code: {c.accessCode}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Link
                      href={`/dashboard/${c._id}`}
                      className="px-3 py-1.5 rounded-full border text-sm bg-white hover:bg-gray-200 transition"
                      style={{ color: colors.text, borderColor: "#bfb8ad" }}
                    >
                      View dashboard
                    </Link>
                  </div>
                </li>
              ))}
              {filtered.length === 0 && (
                <li className="py-4 text-sm text-gray-600">
                  No clients found.
                </li>
              )}
            </ul>
          )}

          {/* Footer actions */}
          <div className="flex justify-between mt-8">
            <Link
              href="/dashboard/register-client"
              className="px-6 py-2.5 rounded-full font-semibold text-white"
              style={{ backgroundColor: colors.header }}
            >
              Register new client
            </Link>
            <Link
              href="/dashboard"
              className="px-6 py-2.5 rounded-full border text-gray-700 hover:bg-gray-200"
            >
              Back to dashboard
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
