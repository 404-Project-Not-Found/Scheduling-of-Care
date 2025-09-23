'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';

type Client = {
  _id?: string;
  name: string;
  dob: string;
  accessCode?: string;
  notes?: string[];
  avatarUrl?: string;
};

// const TEMP_AVATAR_KEY = 'clientAvatar:__temp__';

// ---- Color palette ----
const palette = {
  pageBg: '#ffd9b3', // page background
  header: '#3A0000', // dark brown
  banner: '#F9C9B1', // notice banner
  panelBg: '#fdf4e7', // panel background
  notice: '#F9C9B1', // notice bar background
  accent: '#ff9999', // info dot
  question: '#ff9900', // help bubble
  button: '#F4A261', // primary buttons
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
  const clientId = searchParams.get('id') || undefined;

  const [name, setName] = useState<string>('');
  const [dob, setDob] = useState<string>('');
  const [accessCode, setAccessCode] = useState<string>('');
  const [avatarUrl, setAvatarUrl] = useState<string>('');
  const [notesInput, setNotesInput] = useState<string>('');
  const [savedNotes, setSavedNotes] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(!!clientId);
  const [error, setError] = useState<string>('');

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!clientId) return;

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
      } catch (err) {
        console.error(err);
        setError('Failed to load client data.');
      } finally {
        setLoading(false);
      }
    };
    fetchClient();
  }, [clientId]);

  if (loading)
    return <div style={{ padding: 24 }}>Loading client profile...</div>;
  if (error) return <div style={{ padding: 24, color: 'red' }}>{error}</div>;

  const saveProfile = async () => {
    if (!name.trim() || !dob.trim() || !accessCode.trim()) {
      alert('Please fill in Name, Date of Birth, and Access Code.');
      return false;
    }

    const allNotes = notesInput.trim()
      ? [...savedNotes, notesInput.trim()]
      : savedNotes;

    const payload = { name, dob, accessCode, avatarUrl, notes: allNotes };

    try {
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

  const handleSaveAndReturn = async () => {
    const success = await saveProfile();
    if (success) {
      router.push('/clients_list');
    }
  };

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
                    placeholder={isNew ? 'e.g., 19/09/1943' : undefined}
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
              Save and Return
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
