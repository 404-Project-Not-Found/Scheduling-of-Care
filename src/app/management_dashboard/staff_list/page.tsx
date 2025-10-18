/**
 * File path: src/app/management_dashboard/staff_list/page.tsx
 * Frontend Author: Vanessa Teo
 
 * Last Updated by Denise Alexander - 14/10/2025: back-end integrated to fetch staff
 * lists from DB.
 */

'use client';

import { Search } from 'lucide-react';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardChrome from '@/components/top_menu/client_schedule';
import GenerateCode from '@/components/accesscode/generate-code';

// Type definition for a staff object
type Staff = {
  _id: string;
  name: string;
  email?: string;
  avatarUrl?: string;
  role?: 'management' | 'carer';
  status?: 'active' | 'inactive';
  org?: string;
};

//----------------- Type Definitions -----------------
// Converts unknown errors to a readbale string
function getErrorMessage(err: unknown) {
  if (err instanceof Error) return err.message;
  try {
    return JSON.stringify(err);
  } catch {
    return String(err);
  }
}

//----------------- Colour Palette -----------------
const colors = {
  pageBg: '#ffd9b3',
  cardBg: '#F7ECD9',
  banner: '#F9C9B1',
  header: '#3A0000',
  text: '#2b2b2b',
  help: '#ff9999',
};

export default function StaffListPage() {
  const router = useRouter();
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(true);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showGenerate, setShowGenerate] = useState(false);

  // Fetches the list of staff
  useEffect(() => {
    let alive = true;

    (async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/v1/management/staff', {
          cache: 'no-store',
        });
        if (!res.ok) throw new Error(`Failed to load staff (${res.status})`);

        const data = await res.json();
        if (!data.staff || !Array.isArray(data.staff))
          throw new Error('Invalid response format.');

        if (alive) setStaff(Array.isArray(data.staff) ? data.staff : []);
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

  const removeStaff = async (staffId: string) => {
    if (!confirm('Are you sure you want to remove this staff member?')) return;

    try {
      const res = await fetch(`/api/v1/management/staff?id=${staffId}`, {
        method: 'DELETE',
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Failed to remove staff.');

      setStaff((prev) => prev.filter((s) => s._id !== staffId));
      alert('Staff removed successfully!');
    } catch (err: unknown) {
      alert(getErrorMessage(err));
      console.error('Error removing staff:', err);
    }
  };

  // Search query: filters by name or email (case-insensitive)
  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    const list = Array.isArray(staff) ? staff : [];
    if (!term) return staff;

    return list.filter(
      (s) =>
        s.name.toLowerCase().includes(term) ||
        (s.email?.toLowerCase().includes(term) ?? false) ||
        (s.role?.toLowerCase().includes(term) ?? false) ||
        (s.org?.toLowerCase().includes(term) ?? false)
    );
  }, [q, staff]);

  // Capitalises first letter of the word
  function capitalise(str?: string) {
    if (!str) return '';

    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  }

  return (
    <DashboardChrome
      page="staff-list"
      headerTitle="Staff Schedule"
      navItems={[
        { label: 'Staff List', href: '/management_dashboard/staff_list' },
      ]}
      showClientPicker={false}
      bannerTitle=""
      clients={[]}
      onClientChange={() => {}}
      colors={{
        header: colors.header,
        banner: colors.banner,
        text: colors.text,
      }}
    >
      {/* Page body */}
      <div className="w-full h-full" style={{ backgroundColor: colors.pageBg }}>
        <div className="max-w-[1380px] h-[680px] mx-auto px-6">
          {/* Section title */}
          <div
            className="w-full mt-6 rounded-t-xl px-6 py-4 text-white text-2xl md:text-3xl font-extrabold"
            style={{ backgroundColor: colors.header }}
          >
            Staff List
          </div>

          {/* Controls + List */}
          <div
            className="w-full h-[calc(100%-3rem)] rounded-b-xl bg-[#f6efe2] border-x border-b flex flex-col"
            style={{ borderColor: '#3A000022' }}
          >
            {/* Controls */}
            <div className="flex items-center justify-between px-6 py-4 gap-4">
              {/* Search bar */}
              <div className="relative flex-1 max-w-[350px]">
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Search for staff"
                  className="w-full h-12 rounded-full bg-white border text-black px-10 focus:outline-none"
                  style={{ borderColor: '#3A0000' }}
                />
                <Search
                  size={20}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-black/60 pointer-events-none"
                />
              </div>
              {/* CTA: Register new staff */}
              <button
                onClick={() => setShowGenerate(true)}
                className="rounded-xl px-5 py-3 text-lg font-bold text-white hover:opacity-90"
                style={{ backgroundColor: colors.header }}
              >
                + Generate staff invite code
              </button>
              <GenerateCode
                open={showGenerate}
                onClose={() => setShowGenerate(false)}
              />
            </div>

            {/* List area */}
            <div className="flex-1 px-0 pb-6">
              <div
                className="mx-6 rounded-xl overflow-auto max-h-[500px]"
                style={{
                  backgroundColor: '#F2E5D2',
                  border: '1px solid rgba(58,0,0,0.25)',
                }}
              >
                {loading ? (
                  <div className="h-full flex items-center justify-center text-gray-600">
                    Loading staff...
                  </div>
                ) : error ? (
                  <div className="h-full flex items-center justify-center text-red-600">
                    {error}
                  </div>
                ) : filtered.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-gray-600">
                    No staff found
                  </div>
                ) : (
                  <ul className="divide-y divide-[rgba(58,0,0,0.15)]">
                    {filtered.map((s) => (
                      <li
                        key={s._id}
                        className="flex items-center justify-between gap-5 px-6 py-6 hover:bg-[rgba(255,255,255,0.6)]"
                        onClick={() =>
                          router.push(`/staff_profile?id=${s._id}`)
                        }
                      >
                        {/* Left: avatar + name */}
                        <div className="flex items-center gap-5 cursor-pointer">
                          {/* Avatar circle */}
                          <div
                            className="shrink-0 rounded-full flex items-center justify-center"
                            style={{
                              width: 64,
                              height: 64,
                              border: '1px solid #3A0000',
                              backgroundColor: '#fff',
                              color: '#3A0000',
                              fontWeight: 900,
                              fontSize: 20,
                            }}
                            aria-hidden
                          >
                            {s.name.charAt(0).toUpperCase()}
                          </div>

                          {/* Name + access badge */}
                          <div className="flex flex-col">
                            <div
                              className="text-xl md:text-2xl font-semibold"
                              style={{ color: colors.text }}
                            >
                              {s.name}
                            </div>
                            {s.email && (
                              <div className="text-sm text-black/70">
                                {s.email}
                              </div>
                            )}
                            {s.role && (
                              <div className="text-sm text-black/70">
                                {capitalise(s.role)}
                              </div>
                            )}
                          </div>
                        </div>
                        {/* Remove button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removeStaff(s._id);
                          }}
                          className="px-4 py-2 rounded-lg text-white text-sm font-semibold hover:opacity-90"
                          style={{
                            background:
                              'linear-gradient(90deg, #803030 0%, #B44C4C 100%)',
                            color: '#FFFFFF',
                            border: '1px solid #5A1A1A',
                            boxShadow: '0 2px 6px rgba(58, 0, 0, 0.25)',
                          }}
                        >
                          Remove
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardChrome>
  );
}
