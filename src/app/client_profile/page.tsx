/**
 * Filename: /client_profile/page.tsx
 * Authors:
 * - Frontend UI Build: Devni Wijesinghe
 * - Backend logic: Denise Alexander
 * Last Update by Qingyue Zhao: 2025-10-03
 *
 * Notes:
 * - Fixed-height viewport section (h-[680px]) to avoid bottom gutters.
 * - Family view: two-column editable; Management: same layout, read-only.
 * - "Create one here" triggers AddAccessCodePanel.
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
  getViewerRoleFE,
  type Client as ApiClient,
} from '@/lib/mock/mockApi';

type Role = 'family' | 'carer' | 'management';

const colors = {
  pageBg: '#F7ECD9',
  header: '#3A0000',
  banner: '#F9C9B1',
  text: '#2b2b2b',
  fieldBorder: 'rgba(58,0,0,0.45)',
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
  const sp = useSearchParams();

  const clientIdParam = sp.get('id') || null;
  const isNew = sp.get('new') === 'true';

  // ---- role ----
  const [role, setRole] = useState<Role>('family');
  useEffect(() => {
    const r = getViewerRoleFE();
    if (r === 'family' || r === 'carer' || r === 'management') setRole(r);
  }, []);
  const isFamily = role === 'family';
  const isManagement = role === 'management';
  const isCarer = role === 'carer';

  const backHref =
    isManagement ? '/management_dashboard/clients_list'
    : isCarer ? '/calender_dashboard'
    : '/family_dashboard/people_list';

  // ---- top chrome client switcher ----
  const [clients, setClients] = useState<Array<{ id: string; name: string }>>([]);
  const [activeClientId, setActiveClientId] = useState<string | null>(clientIdParam);
  const [displayName, setDisplayName] = useState<string>('');

  // ---- profile fields ----
  const [name, setName] = useState('');
  const [dob, setDob] = useState('');
  const [accessCode, setAccessCode] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [notesInput, setNotesInput] = useState('');
  const [savedNotes, setSavedNotes] = useState<string[]>([]);

  const [loading, setLoading] = useState<boolean>(!!activeClientId && !isNew);
  const [error, setError] = useState('');

  // ---- access-code drawer ----
  const [showAccessCodeDrawer, setShowAccessCodeDrawer] = useState(false);

  // ---- avatar upload ----
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const openFilePicker = () => fileInputRef.current?.click();
  const handleFileChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => setAvatarUrl(reader.result as string);
    reader.readAsDataURL(f);
    e.target.value = '';
  };

  // ---- load clients ----
  useEffect(() => {
    (async () => {
      try {
        const list = await getClientsFE();
        const mapped = (list as ApiClient[]).map(c => ({ id: c._id as string, name: c.name }));
        setClients(mapped);

        if (isNew) {
          setActiveClientId(null);
          setDisplayName('New Client');
          return;
        }
        if (clientIdParam) {
          const found = mapped.find(m => m.id === clientIdParam);
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
  }, [clientIdParam, isNew]);

  // ---- load one client (skip when new) ----
  useEffect(() => {
    if (isNew) {
      setName(''); setDob(''); setAccessCode(''); setAvatarUrl('');
      setSavedNotes([]); setNotesInput('');
      setLoading(false);
      return;
    }
    if (!activeClientId) { setLoading(false); return; }

    let alive = true;
    (async () => {
      setLoading(true);
      try {
        const client = await getClientByIdFE(activeClientId);
        if (!alive) return;
        if (!client) throw new Error('Client not found');
        setName(client.name || '');
        setDob(client.dob || '');
        setAccessCode(client.accessCode || '');
        setSavedNotes(
        Array.isArray(client.notes)
            ? client.notes
            : client.notes
            ? [client.notes]
            : []
        );
        setAvatarUrl(client.avatarUrl || '');
        setDisplayName(client.name || displayName);
      } catch {
        if (alive) setError('Failed to load client data.');
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [activeClientId, isNew]);

  const onCancel = () => { setNotesInput(''); router.push(backHref); };
  const onSave = () => { router.push(backHref); };

  if (loading) {
    return (
      <DashboardChrome
        page="profile"
        clients={clients}
        activeClientId={activeClientId}
        onClientChange={(id) => router.push(`/client_profile?id=${id}`)}
        activeClientName={displayName || name || 'Client'}
        colors={{ header: colors.header, banner: colors.banner, text: colors.text }}
      >
        <div className="flex-1 flex items-center justify-center" style={{ backgroundColor: colors.pageBg }}>
          <h2 className="text-2xl md:text-3xl font-extrabold">Loading client profile…</h2>
        </div>
      </DashboardChrome>
    );
  }
  if (error) {
    return (
      <DashboardChrome
        page="profile"
        clients={clients}
        activeClientId={activeClientId}
        onClientChange={(id) => router.push(`/client_profile?id=${id}`)}
        activeClientName={displayName || name || 'Client'}
        colors={{ header: colors.header, banner: colors.banner, text: colors.text }}
      >
        <div className="flex-1 flex items-center justify-center" style={{ backgroundColor: colors.pageBg, color: 'red' }}>
          {error}
        </div>
      </DashboardChrome>
    );
  }

  const pageTitle = isNew ? "New Client’s Profile" : `${displayName || name || 'Client'}’s Profile`;

  return (
    <DashboardChrome
      page="profile"
      clients={clients}
      activeClientId={activeClientId}
      onClientChange={(id) => router.push(`/client_profile?id=${id}`)}
      activeClientName={displayName || name || 'Client'}
      colors={{ header: colors.header, banner: colors.banner, text: colors.text }}
    >
      {/* Fixed-height body to avoid page gutter */}
      <div className="w-full h-[680px] flex flex-col" style={{ backgroundColor: colors.pageBg, color: colors.text }}>
        {/* Section bar */}
        <div
          className="w-full flex items-center justify-between px-6 py-3 text-white"
          style={{ backgroundColor: colors.header }}
        >
          <div className="text-xl md:text-2xl font-extrabold">{pageTitle}</div>
          <button
            onClick={() => router.push(backHref)}
            className="text-white/95 hover:underline font-semibold text-lg"
            aria-label="Back"
          >
            &lt; Back
          </button>
        </div>

        {/* Content: two columns
            IMPORTANT:
            - flex-none: do NOT consume remaining height (keeps buttons close)
            - management gets extra top padding using arbitrary value class
        */}
        <div
          className={`max-w-[1100px] w-full mx-auto px-8 ${
            isManagement ? 'pt-30 pb-6' : 'pt-10 pb-6'
          } flex-none`}
        >
          <div className="grid grid-cols-1 md:grid-cols-[380px_1fr] gap-10 items-start">
            {/* Left: avatar */}
            <div className="flex flex-col items-center gap-6">
              <div
                className="rounded-full flex items-center justify-center overflow-hidden"
                style={{
                  width: 260,
                  height: 260,
                  border: `10px solid ${colors.header}`,
                  backgroundColor: '#fff',
                }}
              >
                {avatarUrl ? (
                  <Image
                    src={avatarUrl}
                    alt="Profile avatar"
                    width={260}
                    height={260}
                    className="object-cover rounded-full"
                  />
                ) : (
                  <div className="text-[64px]" style={{ color: colors.header }}>•</div>
                )}
              </div>

              {/* Upload only for family */}
              {isFamily && (
                <>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                  <button
                    onClick={openFilePicker}
                    className="px-6 py-3 rounded-xl text-xl font-bold"
                    style={{ backgroundColor: '#D6C0B1', color: '#1b0b07' }}
                  >
                    Upload photo
                  </button>
                </>
              )}
            </div>

            {/* Right: fields (family editable; management static) */}
            <div className="w-full">
              {/* Name */}
              <FormRow label="Name">
                {isManagement ? (
                  <StaticText value={name} placeholder="This information is not provided" />
                ) : (
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full h-12 rounded-md bg-white border px-3 outline-none text-black"
                    style={{ borderColor: colors.fieldBorder }}
                  />
                )}
              </FormRow>

              {/* DOB */}
              <FormRow label="Date of Birth">
                {isManagement ? (
                  <StaticText value={dob} placeholder="This information is not provided" />
                ) : (
                  <input
                    type="date"
                    value={dob}
                    onChange={(e) => setDob(e.target.value)}
                    className="w-full h-12 rounded-md bg-white border px-3 outline-none text-black"
                    style={{ borderColor: colors.fieldBorder }}
                  />
                )}
              </FormRow>

              {/* Access Code */}
              <FormRow label="Access Code">
                {isManagement ? (
                  <StaticText value={accessCode} placeholder="This information is hidden" />
                ) : (
                  <>
                    <input
                      value={accessCode}
                      onChange={(e) => setAccessCode(e.target.value)}
                      className="w-full h-12 rounded-md bg-white border px-3 outline-none text-black"
                      style={{ borderColor: colors.fieldBorder }}
                    />
                    <div className="text-[15px] mt-2 text-black/80">
                      Don’t have an access code?{' '}
                      <button
                        type="button"
                        className="underline"
                        onClick={() => setShowAccessCodeDrawer(true)}
                      >
                        Create one here
                      </button>
                    </div>
                  </>
                )}
              </FormRow>

              {/* Notes */}
              <FormRow label="Client Notes">
                {isManagement ? (
                  <div className="text-[16px] text-black/80 whitespace-pre-wrap">
                    {savedNotes.length ? savedNotes.join('\n') : 'This information is not provided'}
                  </div>
                ) : (
                  <textarea
                    value={notesInput}
                    onChange={(e) => setNotesInput(e.target.value)}
                    className="w-full min-h-[180px] rounded-md bg-white border px-3 py-2 outline-none text-black"
                    style={{ borderColor: colors.fieldBorder }}
                  />
                )}
              </FormRow>
            </div>
          </div>
        </div>

        {/* Footer buttons: hidden for management.
           NOTE: no bottom padding, no big top margin; stays close to content. */}
        {!isManagement && (
          <div className="flex items-center justify-center gap-20">
            <button
              onClick={onCancel}
              className="px-8 py-3 rounded-2xl text-2xl font-extrabold"
              style={{ backgroundColor: '#D6C0B1', color: '#1b0b07' }}
            >
              Cancel
            </button>
            <button
              onClick={onSave}
              className="px-8 py-3 rounded-2xl text-2xl font-extrabold disabled:opacity-50"
              style={{ backgroundColor: '#D6C0B1', color: '#1b0b07' }}
              disabled={isCarer && notesInput.trim().length === 0}
            >
              {isCarer ? 'Save Notes' : 'Save'}
            </button>
          </div>
        )}
      </div>

      {/* Access Code Drawer */}
      {isFamily && (
        <AddAccessCodePanel
          open={showAccessCodeDrawer}
          onClose={() => setShowAccessCodeDrawer(false)}
        />
      )}
    </DashboardChrome>
  );
}

/* ----- helpers ----- */
function FormRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[220px_1fr] items-start gap-6 mb-6">
      <div className="text-[24px] font-black" style={{ color: '#1b0b07' }}>
        {label}
      </div>
      <div>{children}</div>
    </div>
  );
}

function StaticText({ value, placeholder }: { value?: string; placeholder: string }) {
  const shown = (value ?? '').trim();
  return (
    <div className="text-[16px] text-black/80 min-h-12 flex items-center">
      {shown || placeholder}
    </div>
  );
}
