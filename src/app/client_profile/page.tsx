/**
 * Filename: /client_profile/page.tsx
 * Authors:
 * - Fronntend UI Build: Devni Wijesinghe
 * - Backend logic: Denise Alexander
 * Date Created: 10/09/2025
 * ====================================================================================================
 *
 * Frontend notes(latest update on 30/09/2025 by Qingyue Zhao):
 *
 * - Mock Role: getViewerRoleFE() → 'family' | 'carer' | 'management'
 *
 * - Permissions:
 *    family: edit ALL fields (name, dob, accessCode, avatar, notes)
 *    carer:  add notes ONLY (other fields read-only; no avatar upload)
 *    management: READ-ONLY (no borders, no save, no uploads)
 *
 * - Back page routes:
 *    family → /family_dashboard/people_list
 *    carer → /calender_dashboard
 *    management → /management_dashboard/clients_list
 * ====================================================================================================
 *
 * Backend logic: API endpoints & payloads
 *
 * - Author:
 */

'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import AddAccessCodePanel from '@/components/accesscode/access-code';

// Load data from frontend mock document
import {
  getClientsFE,
  getClientByIdFE,
  isMock,
  getViewerRoleFE, // ← role resolver
} from '@/lib/mockApi';

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

// ----- Color palette -----
const palette = {
  pageBg: '#ffd9b3',
  header: '#3A0000',
  banner: '#F9C9B1',
  panelBg: '#fdf4e7',
  notice: '#F9C9B1',
  accent: '#ff9999',
  question: '#ff9900',
  button: '#F4A261',
  text: '#2b2b2b',
  white: '#FFFFFF',
};

// ----- Wrapper with suspense fallback -----
export default function ClientProfilePage() {
  return (
    <Suspense
      fallback={<div style={{ padding: 24 }}>Loading client profile...</div>}
    >
      <ClientProfilePageInner />
    </Suspense>
  );
}

function ClientProfilePageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Query params
  const isNew = searchParams.get('new') === 'true';
  const clientId = searchParams.get('id') || undefined;

  // ----- Role & permission (from mock API) -----
  const [role, setRole] = useState<Role>('family'); // default while resolving
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const r = await getViewerRoleFE();
        if (alive && (r === 'family' || r === 'carer' || r === 'management')) {
          setRole(r);
        }
      } catch {
        // keep default 'family' if resolution fails
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const canEditAll = role === 'family';
  const canAddNotesOnly = role === 'carer';
  const readOnly = role === 'management';

  const backHref =
    role === 'management'
      ? '/management_dashboard/clients_list'
      : role === 'carer'
        ? '/calendar_dashboard'
        : '/family_dashboard/people_list';

  // ----- Form state -----
  const [name, setName] = useState<string>('');
  const [dob, setDob] = useState<string>('');
  const [accessCode, setAccessCode] = useState<string>('');
  const [avatarUrl, setAvatarUrl] = useState<string>('');
  const [notesInput, setNotesInput] = useState<string>('');
  const [savedNotes, setSavedNotes] = useState<string[]>([]);

  // ----- Page state -----
  const [loading, setLoading] = useState<boolean>(!!clientId);
  const [error, setError] = useState<string>('');
  const [formError, setFormError] = useState<string>('');

  const [existingClientMessage, setExistingClientMessage] = useState<null | {
    name: string;
    dob?: string;
    notes?: string[];
    avatarUrl?: string;
  }>(null);
  const [acceptedExistingClient, setAcceptedExistingClient] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [showAccessCodeDrawer, setShowAccessCodeDrawer] = useState(false);

  // Fetch clients list (backend logic unchanged)
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        if (isMock) {
          const data = await getClientsFE();
          if (active) setClients(Array.isArray(data) ? data : []);
        } else {
          const res = await fetch('/api/clients');
          const data = await res.json();
          if (active) setClients(data);
        }
      } catch (e) {
        console.error('Failed to load clients:', e);
        if (active) setClients([]);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  // Fetch client data if editing existing profile (backend logic unchanged)
  useEffect(() => {
    if (!clientId) return;

    let active = true;
    (async () => {
      setLoading(true);
      try {
        if (isMock) {
          const client = await getClientByIdFE(clientId);
          if (!client) throw new Error('Mock client not found');
          if (!active) return;

          // Use mock data as-is (remove unnecessary hard-coding)
          setName(client.name);
          setDob(client.dob);
          setAccessCode(client.accessCode || '');
          setSavedNotes(client.notes || []);
          setAvatarUrl(client.avatarUrl || '');
        } else {
          const res = await fetch(`/api/clients/${clientId}`);
          if (!res.ok) throw new Error('Failed to fetch client');
          const client: Client = await res.json();
          if (!active) return;

          setName(client.name);
          setDob(client.dob);
          setAccessCode(client.accessCode || '');
          setSavedNotes(client.notes || []);
          setAvatarUrl(client.avatarUrl || '');
        }
      } catch (err) {
        console.error(err);
        if (active) setError('Failed to load client data.');
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [clientId]);

  // Loading / error (unchanged)
  if (loading)
    return (
      <div className="h-screen w-full flex items-center justify-center bg-[#F3E9D9] text-zinc-900">
        <div className="text-center">
          <h2 className="text-4xl font-extrabold mb-4">
            Loading client profile...
          </h2>
        </div>
      </div>
    );
  if (error) return <div style={{ padding: 24, color: 'red' }}>{error}</div>;

  // Save or update client profile (backend calls unchanged).
  // Validation is adapted by role (UI-only) without changing API shape.
  const saveProfile = async () => {
    // family must provide all major fields (original requirement)
    if (canEditAll) {
      if (!name.trim() || !dob.trim() || !accessCode.trim()) {
        setFormError(
          'Please fill in Name, Date of Birth, and Access Code to continue.'
        );
        return false;
      }
    }

    // carer adds notes only: require a note to save (fields are read-only)
    if (canAddNotesOnly) {
      if (!notesInput.trim()) {
        setFormError('Please write a note to save.');
        return false;
      }
    }

    // Duplicate check for new client (only meaningful for family creating)
    if (canEditAll && isNew) {
      const isDuplicate = clients.some(
        (c) => c.accessCode == accessCode.trim()
      );
      if (isDuplicate) {
        setFormError('This client already exists in your list.');
        return false;
      }
    }

    setFormError('');

    // Merge notes (for all roles). For carer, this is the only change.
    const allNotes = notesInput.trim()
      ? [...savedNotes, notesInput.trim()]
      : savedNotes;

    // Access-code existence check only when creating new (keep original behavior)
    if (canEditAll && isNew && !acceptedExistingClient) {
      try {
        const res = await fetch(
          `/api/clients/check?accessCode=${encodeURIComponent(accessCode)}`
        );
        if (!res.ok) throw new Error('Check request failed');
        const data = await res.json();
        if (data.exists && data.client) {
          setExistingClientMessage(data.client);
          return false;
        }
      } catch (err) {
        console.error('Error checking client:', err);
        setFormError('Failed to check access code. Please try again.');
      }
    }

    // Payload unchanged
    const payload = { name, dob, accessCode, avatarUrl, notes: allNotes };

    try {
      // Mock mode: keep behavior (no backend request)
      if (isMock) {
        setSavedNotes(allNotes);
        setNotesInput('');
        return true;
      }

      // Backend paths unchanged
      if (isNew) {
        await fetch('/api/clients', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } else if (clientId) {
        await fetch(`/api/clients/${clientId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }

      setSavedNotes(allNotes);
      setNotesInput('');
      return true;
    } catch (err) {
      console.error('Failed to save profile:', err);
      alert('An error occurred while saving profile. Please try again.');
      return false;
    }
  };

  // Save then go back based on role
  const handleSaveAndReturn = async () => {
    // Only family & carer can save; management has no Save button
    const ok = await saveProfile();
    if (ok) router.push(backHref);
  };

  // Avatar upload (family only)
  const openFilePicker = () => fileInputRef.current?.click();
  const handleFileChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setAvatarUrl(reader.result as string);
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const fieldBorder = readOnly ? 'transparent' : palette.header;
  const title = readOnly
    ? 'View Profile'
    : canAddNotesOnly
      ? 'Client Profile (Add Notes)'
      : isNew
        ? 'Add New Person'
        : 'Edit Profile';

  return (
    <div
      className="min-h-screen w-full flex flex-col"
      style={{ backgroundColor: palette.pageBg, color: palette.text }}
    >
      {/* Top bar with role-based back route */}
      <div
        className="w-full flex items-center justify-center px-6 py-4 relative"
        style={{ backgroundColor: palette.header, color: palette.white }}
      >
        <button
          onClick={() => router.push(backHref)}
          className="absolute left-4 top-1/2 -translate-y-1/2 rounded-md px-2 py-2 focus:outline-none focus:ring-2 focus:ring-white/60 flex items-center gap-2"
          title="Back"
          aria-label="Go back"
        >
          <svg
            width={22}
            height={22}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path d="M15 18l-6-6 6-6" />
          </svg>
          <span className="text-base">Back</span>
        </button>
        <h2 className="text-2xl font-bold">{title}</h2>
      </div>

      {/* Centered white card */}
      <div className="flex-1 w-full flex items-center justify-center px-6 py-8">
        <div className="w-full max-w-4xl">
          <div
            className={`rounded-lg p-8 flex flex-col gap-6 relative pb-6 min-h-[460px] ${readOnly ? '' : 'border'}`}
            style={{ backgroundColor: palette.white, borderColor: fieldBorder }}
          >
            <div className="flex gap-6">
              {/* Avatar: upload only for family */}
              <div className="flex flex-col items-center gap-3">
                <div
                  className="w-[120px] h-[120px] rounded-full overflow-hidden border flex items-center justify-center"
                  style={{
                    backgroundColor: '#e5e7eb',
                    borderColor: fieldBorder,
                  }}
                >
                  {avatarUrl ? (
                    <Image
                      src={avatarUrl}
                      alt="Profile avatar"
                      width={120}
                      height={120}
                      className="object-cover rounded-full"
                    />
                  ) : (
                    <div className="text-gray-500">No Photo</div>
                  )}
                </div>

                {canEditAll && (
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
                      className="px-3 py-2 rounded-md text-sm font-medium hover:opacity-90 transition"
                      style={{
                        backgroundColor: palette.header,
                        color: palette.white,
                      }}
                      title="Upload profile photo"
                    >
                      Upload photo
                    </button>
                  </>
                )}
              </div>

              {/* Fields block */}
              <div className="flex flex-col gap-3 w-full">
                {(canEditAll || canAddNotesOnly) && formError && (
                  <div className="mb-4 p-2 rounded-md bg-red-100 border border-red-400 text-red-700">
                    {formError}
                  </div>
                )}

                {existingClientMessage && canEditAll && (
                  <div
                    className="mb-4 p-3 rounded-md bg-[#fdf4e7] border"
                    style={{ borderColor: fieldBorder }}
                  >
                    A client named &quot;<b>{existingClientMessage.name}</b>
                    &quot; already exists with this access code.
                    <div className="mt-2">
                      <button
                        className="px-3 py-1 rounded bg-[#DFC9A9] hover:opacity-90 text-sm font-semibold"
                        onClick={() => {
                          setName(existingClientMessage.name);
                          setDob(existingClientMessage.dob || '');
                          setSavedNotes(existingClientMessage.notes || []);
                          setAvatarUrl(existingClientMessage.avatarUrl || '');
                          setExistingClientMessage(null);
                          setAcceptedExistingClient(true);
                        }}
                      >
                        Add this client
                      </button>
                      <button
                        className="ml-2 px-3 py-1 rounded bg-gray-200 hover:bg-gray-300 text-sm font-semibold"
                        onClick={() => setExistingClientMessage(null)}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                {/* Name */}
                {canEditAll ? (
                  <label className="text-lg flex items-center gap-3">
                    <span className="font-semibold">Name:</span>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder={isNew ? 'Enter name' : undefined}
                      className="flex-1 max-w-2xl p-2 rounded-md focus:outline-none focus:ring-2"
                      style={{
                        backgroundColor: palette.white,
                        border: `2px solid ${fieldBorder}`,
                        color: palette.text,
                        boxShadow: 'none',
                      }}
                    />
                  </label>
                ) : (
                  <div className="text-lg flex items-center gap-3">
                    <span className="font-semibold">Name:</span>
                    <span>{name || '—'}</span>
                  </div>
                )}

                {/* DOB */}
                {canEditAll ? (
                  <label className="text-lg flex items-center gap-3">
                    <span className="font-semibold">Date of Birth:</span>
                    <input
                      type="text"
                      value={dob}
                      onChange={(e) => setDob(e.target.value)}
                      placeholder={isNew ? 'e.g., 19/09/1943' : undefined}
                      className="flex-1 max-w-2xl p-2 rounded-md focus:outline-none focus:ring-2"
                      style={{
                        backgroundColor: palette.white,
                        border: `2px solid ${fieldBorder}`,
                        color: palette.text,
                        boxShadow: 'none',
                      }}
                    />
                  </label>
                ) : (
                  <div className="text-lg flex items-center gap-3">
                    <span className="font-semibold">Date of Birth:</span>
                    <span>{dob || '—'}</span>
                  </div>
                )}

                {/* Access Code */}
                {canEditAll ? (
                  <label className="text-lg flex items-center gap-3">
                    <span className="font-semibold whitespace-nowrap">
                      Access Code:
                    </span>
                    <input
                      type="text"
                      value={accessCode}
                      onChange={(e) => setAccessCode(e.target.value)}
                      placeholder="Enter or paste your access code"
                      required
                      className="flex-1 max-w-2xl p-2 rounded-md focus:outline-none focus:ring-2"
                      style={{
                        backgroundColor: palette.white,
                        border: `2px solid ${fieldBorder}`,
                        color: palette.text,
                        boxShadow: 'none',
                      }}
                    />
                  </label>
                ) : (
                  <div className="text-lg flex items-center gap-3">
                    <span className="font-semibold whitespace-nowrap">
                      Access Code:
                    </span>
                    <span>{accessCode || '—'}</span>
                  </div>
                )}

                {/* Helper (family only) */}
                {canEditAll && (
                  <div className="ml-[8.5rem]">
                    <p className="text-sm">
                      Don&apos;t have an access code?{' '}
                      <button
                        type="button"
                        onClick={() => setShowAccessCodeDrawer(true)}
                        className="underline underline-offset-2"
                        style={{ color: palette.header }}
                      >
                        Create one here
                      </button>
                    </p>
                  </div>
                )}

                {/* Notes */}
                <p className="text-lg font-semibold mt-2">Client Notes:</p>

                {/* Existing notes */}
                <div className="flex flex-col gap-2">
                  {savedNotes.map((note, idx) => (
                    <div
                      key={idx}
                      className="w-full p-3 rounded-md flex justify-between items-start"
                      style={{
                        backgroundColor: palette.white,
                        border: readOnly
                          ? '1px solid transparent'
                          : `2px solid ${fieldBorder}`,
                        color: palette.text,
                      }}
                    >
                      <span className="whitespace-pre-line">{note}</span>
                      {/* Only family can delete notes */}
                      {canEditAll && (
                        <button
                          onClick={() => {
                            const updated = savedNotes.filter(
                              (_, i) => i !== idx
                            );
                            setSavedNotes(updated);
                          }}
                          className="ml-4 font-bold hover:opacity-80 transition"
                          style={{ color: '#b91c1c' }}
                        >
                          ✖
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                {/* Notes composer:
                   - family: full edit + add notes
                   - carer: add notes only
                   - management: hidden */}
                {(canEditAll || canAddNotesOnly) && (
                  <textarea
                    value={notesInput}
                    onChange={(e) => setNotesInput(e.target.value)}
                    placeholder={
                      canAddNotesOnly
                        ? 'Write a new note…'
                        : 'Write client notes here…'
                    }
                    className="mb-6 w-full min-h-[120px] p-3 rounded-md focus:outline-none focus:ring-2"
                    style={{
                      backgroundColor: palette.white,
                      border: `2px solid ${fieldBorder}`,
                      color: palette.text,
                      boxShadow: 'none',
                    }}
                  />
                )}
              </div>
            </div>
          </div>

          {/* Save:
              - family: Save
              - carer:  Save Notes (disabled until note typed)
              - management: no button */}
          {(canEditAll || canAddNotesOnly) && (
            <div className="flex justify-center mt-6">
              <button
                onClick={handleSaveAndReturn}
                className="px-8 py-3 rounded-lg text-lg hover:opacity-90 transition disabled:opacity-50"
                style={{
                  backgroundColor: palette.header,
                  color: palette.white,
                }}
                disabled={canAddNotesOnly && notesInput.trim().length === 0}
              >
                {canAddNotesOnly ? 'Save Notes' : 'Save'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Access code panel (family only) */}
      {canEditAll && (
        <AddAccessCodePanel
          open={showAccessCodeDrawer}
          onClose={() => setShowAccessCodeDrawer(false)}
        />
      )}
    </div>
  );
}
