'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';

// ===== Demo IDs & mapping (match your family list) =====
const FULL_DASH_ID = 'hardcoded-full-1'; // Mary
const PARTIAL_DASH_ID = 'hardcoded-partial-1'; // John
const DEMO_NAME_DOB_BY_ID: Record<string, { name: string; dob: string }> = {
  [FULL_DASH_ID]: { name: 'Mary Hong', dob: '2019-12-19' },
  [PARTIAL_DASH_ID]: { name: 'John Smith', dob: '2018-03-05' },
};
const isDemoId = (id?: string | null) =>
  !!id && (id === FULL_DASH_ID || id === PARTIAL_DASH_ID);

// ----- Types -----
type Client = {
  _id?: string;
  name: string;
  dob: string;
  accessCode?: string;
  notes?: string[];
  avatarUrl?: string;
};

type Role = 'carer' | 'family' | 'management';

// ----- Role helpers -----
function getActiveRole(): Role {
  // Frontend mock priority: localStorage.activeRole -> sessionStorage.mockRole -> 'carer'
  if (typeof window === 'undefined') return 'carer';
  const r =
    (localStorage.getItem('activeRole') as Role | null) ||
    (sessionStorage.getItem('mockRole') as Role | null) ||
    'carer';
  return (['carer', 'family', 'management'] as Role[]).includes(r)
    ? r
    : 'carer';
}

function dashboardPathByRole(role: Role): string {
  switch (role) {
    case 'carer':
      return '/full_dashboard';
    case 'management':
      return '/menu/management';
    case 'family':
      // resolved separately for family
      return '/menu/family';
    default:
      return '/carer_dashboard';
  }
}

// ----- Family return resolver -----
/**
 * Decide where a FAMILY user should go back to:
 * 1) Prefer URL param `from`:
 *    - 'partial_dashboard' -> /partial_dashboard
 *    - 'full_dashboard'    -> /full_dashboard?viewer=family
 * 2) Fallback to localStorage.lastDashboard:
 *    - 'full'              -> /full_dashboard?viewer=family
 *    - 'partial' or others -> /partial_dashboard
 * 3) Final fallback -> /partial_dashboard
 */
function resolveFamilyReturnPath(searchParams: URLSearchParams): string {
  const from = searchParams.get('from');
  if (from === 'partial_dashboard') return '/partial_dashboard';
  if (from === 'full_dashboard') return '/full_dashboard?viewer=family';

  if (typeof window !== 'undefined') {
    const last = localStorage.getItem('lastDashboard'); // 'partial' | 'full'
    if (last === 'full') return '/full_dashboard?viewer=family';
    if (last === 'partial') return '/partial_dashboard';
  }
  return '/partial_dashboard';
}

// ----- UI palette -----
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

// ----- Page (Suspense wrapper) -----
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

  // Query flags
  const isNew = searchParams.get('new') === 'true';
  const clientId = searchParams.get('id') || undefined;

  // ----- Form state -----
  const [name, setName] = useState<string>('');
  const [dob, setDob] = useState<string>(''); // free text
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

  // ----- Smart "Back" -----
  const goBackToDashboard = () => {
    const role = getActiveRole();
    if (role === 'family') {
      router.push(resolveFamilyReturnPath(searchParams));
      return;
    }
    router.push(dashboardPathByRole(role));
  };

  // ===== Prefill from localStorage / demo map (BEFORE any backend fetch) =====
  useEffect(() => {
    try {
      // Highest priority: value written by list/partial/full pages
      const lsName = localStorage.getItem('currentClientName') || '';
      const lsDob = localStorage.getItem('currentClientDob') || '';

      if (lsName) setName((prev) => prev || lsName);
      if (lsDob) setDob((prev) => prev || lsDob);

      const activeId = localStorage.getItem('activeClientId');
      // Family demo fallback by id
      if (isDemoId(activeId) && (!lsName || !lsDob)) {
        const demo = DEMO_NAME_DOB_BY_ID[activeId as string];
        if (demo) {
          if (!lsName) setName((prev) => prev || demo.name);
          if (!lsDob) setDob((prev) => prev || demo.dob);
        }
      }
    } catch {
      // ignore
    }
  }, []);

  // ----- Data fetching -----
  // Fetch all clients (for duplicate check / list sync) — keep backend flow
  useEffect(() => {
    async function fetchClients() {
      try {
        const res = await fetch('/api/clients');
        const data: Client[] = await res.json();
        setClients(data);
      } catch (e: unknown) {
        console.warn('Failed to fetch clients list:', e);
      }
    }
    fetchClients();
  }, []);

  // Fetch client data if editing an existing profile
  useEffect(() => {
    // If this is family demo user clicking from full/partial and id是demo，直接用本地数据，不打后端
    if (isDemoId(clientId) && getActiveRole() === 'family') {
      // 我们已经在上面的 prefill 里把 name/dob 兜底了，这里只需要结束 loading
      setLoading(false);
      return;
    }

    if (!clientId) {
      setLoading(false);
      return;
    }

    const fetchClient = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/clients/${clientId}`);
        if (!res.ok) {
          throw new Error('Failed to fetch client');
        }
        const client: Client = await res.json();

        setName(client.name);
        setDob(client.dob);
        setAccessCode(client.accessCode || '');
        setSavedNotes(client.notes || []);
        setAvatarUrl(client.avatarUrl || '');
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error('Error fetching client:', msg);
        setError('Failed to load client data.');
      } finally {
        setLoading(false);
      }
    };
    fetchClient();
  }, [clientId]);

  // ----- Save -----
  const saveProfile = async (): Promise<boolean> => {
    if (!name.trim() || !dob.trim() || !accessCode.trim()) {
      setFormError(
        'Please fill in Name, Date of Birth, and Access Code to continue.'
      );
      return false;
    }

    // Duplicate check when creating new
    const isDuplicate = clients.some((c) => c.accessCode === accessCode.trim());
    if (isDuplicate && isNew) {
      setFormError('This client already exists in your list.');
      return false;
    }

    setFormError('');

    // Merge new note (if any) with saved notes
    const allNotes = notesInput.trim()
      ? [...savedNotes, notesInput.trim()]
      : savedNotes;

    // === Family demo: do not hit backend when editing demo entries ===
    if (getActiveRole() === 'family' && (isDemoId(clientId) || !clientId)) {
      try {
        // Best-effort persist to localStorage so family sees their edits immediately
        localStorage.setItem('currentClientName', name);
        localStorage.setItem('currentClientDob', dob);
      } catch {}
      setSavedNotes(allNotes);
      setNotesInput('');
      return true;
    }

    // For new clients, confirm with backend if access code already exists
    if (isNew && !acceptedExistingClient) {
      try {
        const res = await fetch(
          `/api/clients/check?accessCode=${encodeURIComponent(accessCode)}`
        );
        if (!res.ok) throw new Error('Check request failed');
        const data: { exists: boolean; client?: Client } = await res.json();

        if (data.exists && data.client) {
          setExistingClientMessage(data.client);
          return false;
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error('Error checking client:', msg);
        setFormError('Failed to check access code. Please try again.');
        return false;
      }
    }

    // Request payload; keep backend contract intact
    const payload: Client = {
      name,
      dob,
      accessCode,
      avatarUrl,
      notes: allNotes,
    };

    try {
      if (isNew) {
        const res = await fetch('/api/clients', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error('Create request failed');
      } else if (clientId) {
        const res = await fetch(`/api/clients/${clientId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error('Update request failed');
      }

      setSavedNotes(allNotes);
      setNotesInput('');

      return true;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error('Failed to save profile:', msg);
      alert(`An error occurred while saving profile. ${msg}`);
      return false;
    }
  };

  // Save and go back using the smart return logic
  const handleSaveAndReturn = async () => {
    const success = await saveProfile();
    if (success) {
      goBackToDashboard();
    }
  };

  // ----- Avatar upload -----
  const openFilePicker = () => fileInputRef.current?.click();
  const handleFileChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setAvatarUrl(dataUrl);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // ----- Render -----
  if (loading)
    return <div style={{ padding: 24 }}>Loading client profile...</div>;
  if (error) return <div style={{ padding: 24, color: 'red' }}>{error}</div>;

  return (
    <div
      className="min-h-screen w-full flex flex-col"
      style={{ backgroundColor: palette.pageBg, color: palette.text }}
    >
      {/* Top bar */}
      <div
        className="w-full flex items-center justify-center px-6 py-4 relative"
        style={{ backgroundColor: palette.header, color: palette.white }}
      >
        <button
          onClick={goBackToDashboard}
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
        <h2 className="text-2xl font-bold">
          {isNew ? 'Add New Person' : 'Edit Profile'}
        </h2>
      </div>

      {/* Center card */}
      <div className="flex-1 w-full flex items-center justify-center px-6 py-8">
        <div className="w-full max-w-4xl">
          <div
            className="rounded-lg p-8 flex flex-col gap-6 relative pb-6 min-h-[460px] border"
            style={{
              backgroundColor: palette.white,
              borderColor: palette.header,
            }}
          >
            <div className="flex gap-6">
              {/* Avatar */}
              <div className="flex flex-col items-center gap-3">
                <div
                  className="w-[120px] h-[120px] rounded-full overflow-hidden border flex items-center justify-center"
                  style={{
                    backgroundColor: '#e5e7eb',
                    borderColor: palette.header,
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
              </div>

              {/* Editable fields */}
              <div className="flex flex-col gap-3 w-full">
                {/* Form error */}
                {formError && (
                  <div className="mb-4 p-2 rounded-md bg-red-100 border border-red-400 text-red-700">
                    {formError}
                  </div>
                )}

                {/* Existing client notice from /api/clients/check */}
                {existingClientMessage && (
                  <div className="mb-4 p-3 rounded-md bg-[#fdf4e7] border border-[#DFC9A9]">
                    A client named &quot;<b>{existingClientMessage.name}</b>
                    &quot; already exists with this access code.
                    <div className="mt-2">
                      <button
                        className="px-3 py-1 rounded bg-[#DFC9A9] hover:bg-[#d1b38d] text-sm font-semibold"
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
                      border: `2px solid ${palette.header}`,
                      color: palette.text,
                      boxShadow: 'none',
                    }}
                  />
                </label>

                {/* DOB (free text) */}
                <label className="text-lg flex items-center gap-3">
                  <span className="font-semibold">Date of Birth:</span>
                  <input
                    type="text"
                    value={dob}
                    onChange={(e) => setDob(e.target.value)}
                    placeholder={
                      isNew ? 'e.g., 19/09/1943 or 1943-09-19' : undefined
                    }
                    className="flex-1 max-w-2xl p-2 rounded-md focus:outline-none focus:ring-2"
                    style={{
                      backgroundColor: palette.white,
                      border: `2px solid ${palette.header}`,
                      color: palette.text,
                      boxShadow: 'none',
                    }}
                  />
                </label>

                {/* Access Code (required) */}
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
                      border: `2px solid ${palette.header}`,
                      color: palette.text,
                      boxShadow: 'none',
                    }}
                  />
                </label>

                {/* Helper line */}
                <div className="ml-[8.5rem]">
                  <p className="text-sm">
                    Don&apos;t have an access code?{' '}
                    <button
                      type="button"
                      onClick={() => router.push('/create_access_code')}
                      className="underline underline-offset-2"
                      style={{ color: palette.header }}
                    >
                      Create one here
                    </button>
                  </p>
                </div>

                {/* Notes */}
                <p className="text-lg font-semibold mt-2">Client Notes:</p>

                {/* Saved notes list */}
                <div className="flex flex-col gap-2">
                  {savedNotes.map((note, idx) => (
                    <div
                      key={idx}
                      className="w-full p-3 rounded-md flex justify-between items-start"
                      style={{
                        backgroundColor: palette.white,
                        border: `2px solid ${palette.header}`,
                        color: palette.text,
                      }}
                    >
                      <span className="whitespace-pre-line">{note}</span>
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
                    </div>
                  ))}
                </div>

                {/* Notes input */}
                <textarea
                  value={notesInput}
                  onChange={(e) => setNotesInput(e.target.value)}
                  placeholder="Write client notes here..."
                  className="mb-6 w-full min-h-[120px] p-3 rounded-md focus:outline-none focus:ring-2"
                  style={{
                    backgroundColor: palette.white,
                    border: `2px solid ${palette.header}`,
                    color: palette.text,
                    boxShadow: 'none',
                  }}
                />
              </div>
            </div>
          </div>

          {/* Save profile */}
          <div className="flex justify-center mt-6">
            <button
              onClick={handleSaveAndReturn}
              className="px-8 py-3 rounded-lg text-lg hover:opacity-90 transition"
              style={{ backgroundColor: palette.header, color: palette.white }}
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
