'use client';

import { use } from 'react';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import CalendarPanel from '@/components/calendar/CalendarPanel';
import TasksPanel from '@/components/tasks/TasksPanel';
import SideMenu from '@/components/side_menu/management';

type PageProps = { params: Promise<{ id: string }> };

type Client = {
  _id: string;
  fullName: string;
  avatarUrl?: string;
  accessCode?: string;
};

export default function ClientDashboardPage({ params }: PageProps) {
  const { id } = use(params);

  const [menuOpen, setMenuOpen] = useState(false);
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch(`/api/v1/clients/${id}`, {
          cache: 'no-store',
        });
        if (!res.ok) throw new Error(`Failed to load client (${res.status})`);
        const data = (await res.json()) as Client;
        if (alive) setClient(data);
      } catch (e) {
        if (alive) setErr(e instanceof Error ? e.message : String(e));
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [id]);

  return (
    <div className="min-h-screen">
      <SideMenu open={menuOpen} onClose={() => setMenuOpen(false)} />

      <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch px-6">
        {/* LEFT: Calendar card */}
        <section className="flex flex-col rounded-2xl overflow-hidden bg-[#F7ECD9] border border-black/10">
          {/* Maroon header */}
          <div className="bg-[#3d0000] text-white px-5 py-6 flex items-center justify-between">
            <div className="text-lg font-semibold flex items-center gap-3">
              <button
                type="button"
                onClick={() => setMenuOpen(true)}
                className="inline-flex items-center justify-center h-7 w-7 rounded-full bg-white/15"
                aria-label="Open menu"
              >
                ≡
              </button>
              <span>Dashboard</span>
              <Image
                src="/dashboardLogo.png"
                alt="App Logo"
                width={80}
                height={80}
                className="object-contain"
                priority
              />
            </div>

            <div className="flex items-center gap-3">
              <span className="truncate max-w-[14rem]">
                {loading ? 'Loading…' : (client?.fullName ?? 'Unknown client')}
              </span>
              <div className="h-16 w-16 rounded-full border border-white overflow-hidden bg-white/20">
                {client?.avatarUrl ? (
                  <Image
                    src={client.avatarUrl}
                    alt={`${client.fullName} avatar`}
                    width={64}
                    height={64}
                    className="h-16 w-16 object-cover"
                  />
                ) : (
                  <Image
                    src="/default-avatar.png"
                    alt="Profile Picture"
                    width={64}
                    height={64}
                    className="h-16 w-16 object-cover"
                  />
                )}
              </div>
            </div>
          </div>

          {/* Body */}
          <div className="p-5 flex-1">
            {err && <p className="text-red-500 text-sm mb-2">{err}</p>}

            <CalendarPanel />
          </div>
        </section>

        {/* RIGHT: Tasks card */}
        <section className="flex flex-col rounded-2xl overflow-hidden bg-[#F7ECD9] border border-black/10">
          <div className="bg-[#3d0000] text-white px-5 py-12.5">
            <h2 className="text-lg font-semibold">Tasks</h2>
          </div>
          <div className="p-5 flex-1">
            <TasksPanel />
          </div>
        </section>
      </div>
    </div>
  );
}
