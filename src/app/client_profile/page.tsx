/**
 * Filename: /client_profile/page.tsx
 * Authors:
 * - Frontend UI Build: Devni Wijesinghe
 * - Backend logic: Denise Alexander
 * Date Created: 10/09/2025
 * ====================================================================================================
 *
 * Frontend notes (latest update on 03/10/2025 by Qingyue Zhao):
 *
 * - Layout update: fields stacked vertically (one per row), all centered; avatar centered at the top.
 * - Permissions same as before.
 * ====================================================================================================
 */

'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import AddAccessCodePanel from '@/components/accesscode/access-code';
import DashboardChrome from '@/components/top_menu/client_schedule';

import {
  getClientsFE,
  getClientByIdFE,
  isMock,
  getViewerRoleFE,
  type Client as ApiClient,
} from '@/lib/mock/mockApi';

// ----- Types -----
type Client = {
  _id?: string;
  name: string;
  dob: string;
  accessCode?: string;
  notes?: string[];
  avatarUrl?: string;
};
type Role = 'family' | 'carer' | 'management';

// ----- Colors -----
const palette = {
  pageBg: '#F7ECD9', // full-screen warm background
  header: '#3A0000',
  banner: '#F9C9B1',
  text: '#2b2b2b',
  white: '#FFFFFF',
};

export default function ClientProfilePage() {
  return (
    <Suspense fallback={<div style={{ padding: 24 }}>Loading client profile...</div>}>
      <ClientProfilePageInner />
    </Suspense>
  );
}

function ClientProfilePageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const clientIdParam = searchParams.get('id') || null;

  const [role, setRole] = useState<Role>('family');
  useEffect(() => {
    const r = getViewerRoleFE();
    if (r === 'family' || r === 'carer' || r === 'management') setRole(r);
  }, []);
  const canEditAll = role === 'family';
  const canAddNotesOnly = role === 'carer';
  const readOnly = role === 'management';

  const backHref =
    role === 'management'
      ? '/management_dashboard/clients_list'
      : role === 'carer'
      ? '/calender_dashboard'
      : '/family_dashboard/people_list';

  const [clients, setClients] = useState<Array<{ id: string; name: string }>>([]);
  const [activeClientId, setActiveClientId] = useState<string | null>(clientIdParam);
  const [displayName, setDisplayName] = useState<string>('');

  // profile states
  const [name, setName] = useState<string>('');
  const [dob, setDob] = useState<string>('');
  const [accessCode, setAccessCode] = useState<string>('');
  const [avatarUrl, setAvatarUrl] = useState<string>('');
  const [notesInput, setNotesInput] = useState<string>('');
  const [savedNotes, setSavedNotes] = useState<string[]>([]);

  const [loading, setLoading] = useState<boolean>(!!activeClientId);
  const [error, setError] = useState<string>('');
  const [formError, setFormError] = useState<string>('');

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [showAccessCodeDrawer, setShowAccessCodeDrawer] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const list = await getClientsFE();
        const mapped = (list as ApiClient[]).map((c) => ({ id: c._id as string, name: c.name }));
        setClients(mapped);
        if (clientIdParam) {
          const found = mapped.find((m) => m.id === clientIdParam);
          if (found) {
            setActiveClientId(found.id);
            setDisplayName(found.name);
          }
        } else if (mapped.length > 0) {
          setActiveClientId(mapped[0].id);
          setDisplayName(mapped[0].name);
        }
      } catch {
        setClients([]);
      }
    })();
  }, [clientIdParam]);

  useEffect(() => {
    if (!activeClientId) {
      setLoading(false);
      return;
    }
    let alive = true;
    (async () => {
      setLoading(true);
      try {
        const client = await getClientByIdFE(activeClientId);
        if (!client) throw new Error('Mock client not found');
        if (!alive) return;
        setName(client.name);
        setDob(client.dob);
        setAccessCode(client.accessCode || '');
        setSavedNotes(client.notes || []);
        setAvatarUrl(client.avatarUrl || '');
        setDisplayName(client.name || displayName);
      } catch (err) {
        if (alive) setError('Failed to load client data.');
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [activeClientId]);

  const openFilePicker = () => fileInputRef.current?.click();
  const handleFileChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setAvatarUrl(reader.result as string);
    reader.readAsDataURL(file);
    e.target.value = '';
  };

//   if (loading) {
//     return (
//       <DashboardChrome
//         page="profile"
//         clients={clients}
//         activeClientId={activeClientId}
//         onClientChange={(id) => router.push(`/client_profile?id=${id}`)}
//         activeClientName={displayName || name || 'Client'}
//         colors={{ header: palette.header, banner: palette.banner, text: palette.text }}
//       >
//         <div className="flex-1 flex items-center justify-center" style={{ backgroundColor: palette.pageBg }}>
//           <h2 className="text-4xl font-extrabold">Loading client profile...</h2>
//         </div>
//       </DashboardChrome>
//     );
//   }

//   if (error) {
//     return (
//       <DashboardChrome
//         page="profile"
//         clients={clients}
//         activeClientId={activeClientId}
//         onClientChange={(id) => router.push(`/client_profile?id=${id}`)}
//         activeClientName={displayName || name || 'Client'}
//         colors={{ header: palette.header, banner: palette.banner, text: palette.text }}
//       >
//         <div className="flex-1 flex items-center justify-center" style={{ backgroundColor: palette.pageBg, color: 'red' }}>
//           {error}
//         </div>
//       </DashboardChrome>
//     );
//   }

  return (
    <DashboardChrome
      page="profile"
      clients={clients}
      activeClientId={activeClientId}
      onClientChange={(id) => router.push(`/client_profile?id=${id}`)}
      activeClientName={displayName || name || 'Client'}
      colors={{ header: palette.header, banner: palette.banner, text: palette.text }}
    >
      <div
        className="h-[670px] flex flex-col items-center justify-start gap-10 px-6 py-20"
        style={{ backgroundColor: palette.pageBg, color: palette.text }}
      >
        {/* Center avatar */}
        <div className="flex flex-col items-center gap-10">
          <div className="w-[140px] h-[140px] rounded-full overflow-hidden border flex items-center justify-center bg-gray-200">
            {avatarUrl ? (
              <Image src={avatarUrl} alt="Profile avatar" width={140} height={140} className="object-cover rounded-full" />
            ) : (
              <div className="text-gray-500">No Photo</div>
            )}
          </div>
          {canEditAll && (
            <>
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
              <button
                onClick={openFilePicker}
                className="px-4 py-2 rounded-md text-sm font-medium hover:opacity-90 transition"
                style={{ backgroundColor: palette.header, color: palette.white }}
              >
                Upload photo
              </button>
            </>
          )}
        </div>

        {/* Fields - stacked rows, centered */}
        <div className="w-full max-w-2xl flex flex-col gap-4 items-center text-lg">
          <div><span className="font-semibold">Name:</span> {name || '—'}</div>
          <div><span className="font-semibold">Date of Birth:</span> {dob || '—'}</div>
          <div><span className="font-semibold">Access Code:</span> {accessCode || '—'}</div>
        </div>

        {/* Notes */}
        <div className="w-full max-w-2xl flex flex-col items-center gap-4">
          <p className="text-lg font-semibold">Client Notes:</p>
          {savedNotes.length === 0 && <div className="text-black/60">No notes yet.</div>}
          {savedNotes.map((note, idx) => (
            <div key={idx} className="w-full p-3 bg-white/70 rounded-md text-center">
              {note}
            </div>
          ))}
          {(canEditAll || canAddNotesOnly) && (
            <textarea
              value={notesInput}
              onChange={(e) => setNotesInput(e.target.value)}
              placeholder="Write client notes here…"
              className="w-full min-h-[100px] p-3 rounded-md focus:outline-none focus:ring-2"
              style={{ backgroundColor: palette.white }}
            />
          )}
        </div>

        {/* Bottom action button(s) */}
        <div className="w-full flex justify-center">
            {readOnly ? (
                // management: centered back button
                <button
                onClick={() => router.push('/calender_dashboard')}
                className="px-8 py-3 rounded-lg text-lg hover:opacity-90 transition"
                style={{ backgroundColor: palette.header, color: palette.white }}
                title="Back to Client Schedule"
                >
                Back to Client Schedule
                </button>
            ) : (
                // family / carer: save
                (canEditAll || canAddNotesOnly) && (
                <button
                    onClick={() => router.push(backHref)} 
                    className="px-8 py-3 rounded-lg text-lg hover:opacity-90 transition disabled:opacity-50"
                    style={{ backgroundColor: palette.header, color: palette.white }}
                    disabled={canAddNotesOnly && notesInput.trim().length === 0}
                >
                    {canAddNotesOnly ? 'Save Notes' : 'Save'}
                </button>
                )
            )}
        </div>

      </div>

      {canEditAll && (
        <AddAccessCodePanel open={showAccessCodeDrawer} onClose={() => setShowAccessCodeDrawer(false)} />
      )}
    </DashboardChrome>
  );
}
