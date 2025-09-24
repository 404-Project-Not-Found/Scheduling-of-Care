'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import AddAccessCodePanel from '../create-access-code/AddAccessCodePanel';

type Client = {
  name: string;
  dob: string;
  accessCode?: string;
  notes?: string[];
};

const TEMP_AVATAR_KEY = 'clientAvatar:__temp__';

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
  const isNew = searchParams.get('new') === 'true';

  const initNameFromQuery = searchParams.get('name') || '';
  const initDobFromQuery = searchParams.get('dob') || '';
  const initAccessFromQuery = searchParams.get('accessCode') || '';

  const [name, setName] = useState<string>(
    isNew ? '' : initNameFromQuery || ''
  );
  const [dob, setDob] = useState<string>(isNew ? '' : initDobFromQuery || '');
  const [accessCode, setAccessCode] = useState<string>(
    isNew ? '' : initAccessFromQuery || ''
  );
  const [avatarUrl, setAvatarUrl] = useState<string>('');
  const [showAccessCodePanel, setShowAccessCodePanel] = useState(false);

  const prevNameRef = useRef<string>(name);
  const notesKey = `clientNotes:${name}`;
  const [notesInput, setNotesInput] = useState<string>('');
  const [savedNotes, setSavedNotes] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const loadNotesByName = (personName: string) => {
    const key = `clientNotes:${personName}`;
    const stored =
      typeof window !== 'undefined' ? localStorage.getItem(key) : null;
    if (!stored) return [];
    try {
      const parsed = JSON.parse(stored);
      return Array.isArray(parsed) ? parsed : [stored];
    } catch {
      return [stored];
    }
  };

  const loadAvatar = (personName: string) => {
    if (typeof window === 'undefined') return '';
    const trimmed = personName.trim();
    if (trimmed) return localStorage.getItem(`clientAvatar:${trimmed}`) || '';
    return localStorage.getItem(TEMP_AVATAR_KEY) || '';
  };

  useEffect(() => {
    setSavedNotes(loadNotesByName(name));
    setAvatarUrl(loadAvatar(name));
  }, [name]);

  useEffect(() => {
    if (isNew) return;
    const listRaw =
      typeof window !== 'undefined' ? localStorage.getItem('clients') : null;
    if (!listRaw) return;
    try {
      const list: Client[] = JSON.parse(listRaw);
      const found = list.find((c) => c.name === name);
      if (!dob && found?.dob) setDob(found.dob);
      if (!accessCode && found?.accessCode) setAccessCode(found.accessCode);
    } catch {}
  }, [isNew, name, dob, accessCode]);

  const saveProfile = () => {
    if (!name.trim() || !dob.trim() || !accessCode.trim()) {
      alert('Please fill in Name, Date of Birth, and Access Code.');
      return false;
    }
    let clients: Client[] = [];
    const raw = localStorage.getItem('clients');
    if (raw) {
      try {
        clients = JSON.parse(raw);
      } catch {}
    }

    // migrate notes & avatar when renaming
    const oldName = prevNameRef.current;
    if (oldName && oldName !== name) {
      const oldNotesKey = `clientNotes:${oldName}`;
      const newNotesKey = `clientNotes:${name}`;
      const existingOldNotes = localStorage.getItem(oldNotesKey);
      if (existingOldNotes && !localStorage.getItem(newNotesKey)) {
        localStorage.setItem(newNotesKey, existingOldNotes);
        localStorage.removeItem(oldNotesKey);
      }
      const oldAvatarKey = `clientAvatar:${oldName}`;
      const newAvatarKey = `clientAvatar:${name}`;
      const oldAvatar = localStorage.getItem(oldAvatarKey);
      if (oldAvatar && !localStorage.getItem(newAvatarKey)) {
        localStorage.setItem(newAvatarKey, oldAvatar);
        localStorage.removeItem(oldAvatarKey);
      }
      prevNameRef.current = name;
    }

    // move temp avatar into named slot on save
    if (!localStorage.getItem(`clientAvatar:${name}`)) {
      const temp = localStorage.getItem(TEMP_AVATAR_KEY);
      if (temp) {
        localStorage.setItem(`clientAvatar:${name}`, temp);
        localStorage.removeItem(TEMP_AVATAR_KEY);
      }
    }

    const upsert = (targetName: string) => {
      const idx = clients.findIndex((c) => c.name === targetName);
      const payload: Client = {
        name,
        dob,
        accessCode: accessCode || undefined,
      };
      if (idx >= 0) clients[idx] = { ...clients[idx], ...payload };
      else clients.push(payload);
    };
    upsert(name);

    if (avatarUrl) localStorage.setItem(`clientAvatar:${name}`, avatarUrl);

    const current = loadNotesByName(name);
    const updatedNotes = notesInput.trim()
      ? [...current, notesInput.trim()]
      : current;
    localStorage.setItem(notesKey, JSON.stringify(updatedNotes));
    setSavedNotes(updatedNotes);

    localStorage.setItem('clients', JSON.stringify(clients));
    return true;
  };

  const handleSaveAndReturn = () => {
    if (!saveProfile()) return;
    setNotesInput('');
    router.push('/clients_list');
  };

  const openFilePicker = () => fileInputRef.current?.click();
  const handleFileChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setAvatarUrl(dataUrl);
      const key = name.trim() ? `clientAvatar:${name.trim()}` : TEMP_AVATAR_KEY;
      try {
        localStorage.setItem(key, dataUrl);
      } catch {}
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

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
          onClick={() => router.push('/clients_list')}
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
        <h2 className="text-2xl font-bold">Client Profile</h2>
      </div>

      {/* Centered white card */}
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

              {/* Editable profile fields */}
              <div className="flex flex-col gap-3 w-full">
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

                {/* DOB */}
                <label className="text-lg flex items-center gap-3">
                  <span className="font-semibold">Date of Birth:</span>
                  <input
                    type="text"
                    value={dob}
                    onChange={(e) => setDob(e.target.value)}
                    placeholder={
                      isNew
                        ? 'e.g., 1943-09-16 or 16th September 1943'
                        : undefined
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

                {/* Helper line aligned with input left edge */}
                <div className="ml-[8.5rem]">
                  <p className="text-sm">
                    Don&apos;t have an access code?{' '}
                    <button
                      type="button"
                      onClick={() => setShowAccessCodePanel(true)} // open drawer instead of navigation
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
                          localStorage.setItem(
                            notesKey,
                            JSON.stringify(updated)
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
              Save and Return
            </button>
          </div>
        </div>
      </div>

      {/* ===== Backdrop + Right Drawer ===== */}
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-40 bg-black/30 transition-opacity duration-300 ${showAccessCodePanel ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
        onClick={() => setShowAccessCodePanel(false)}
        aria-hidden="true"
      />
      {/* Drawer Panel */}
      <div
        className={`fixed right-0 top-0 z-50 h-full w-full sm:w-1/2 bg-white shadow-xl transform transition-transform duration-300
          ${showAccessCodePanel ? 'translate-x-0' : 'translate-x-full'}`}
        role="dialog"
        aria-modal="true"
        aria-label="Create access code panel"
      >
        <AddAccessCodePanel onClose={() => setShowAccessCodePanel(false)} />
      </div>
    </div>
  );
}
