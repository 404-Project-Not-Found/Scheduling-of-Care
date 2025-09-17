"use client";

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

type Client = { name: string; dob: string; notes?: string[] };

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

  // Check if this is a new client creation
  const isNew = searchParams.get('new') === 'true';

  // Initial values from URL (in edit mode)
  const initNameFromQuery = searchParams.get('name') || '';
  const initDobFromQuery = searchParams.get('dob') || '';

  // Editable Name / DOB fields
  const [name, setName] = useState<string>(isNew ? '' : initNameFromQuery || 'Florence Edwards');
  const [dob, setDob] = useState<string>(isNew ? '' : initDobFromQuery || '16th September 1943');

  // Store the old name when entering the page (used for migrating notes key)
  const prevNameRef = useRef<string>(name);

  // Notes storage key: clientNotes:<name>
  const notesKey = `clientNotes:${name}`;
  const [notesInput, setNotesInput] = useState<string>('');
  const [savedNotes, setSavedNotes] = useState<string[]>([]);

  // Load notes for a specific client name
  const loadNotesByName = (personName: string) => {
    const key = `clientNotes:${personName}`;
    const stored = localStorage.getItem(key);
    if (!stored) return [];
    try {
      const parsed = JSON.parse(stored);
      return Array.isArray(parsed) ? parsed : [stored];
    } catch {
      return [stored];
    }
  };

  // Reload notes when name changes
  useEffect(() => {
    setSavedNotes(loadNotesByName(name));
  }, [name]);

  // Edit mode: if DOB is missing, try to fetch it from the clients list
  useEffect(() => {
    if (isNew || dob) return;
    const listRaw = localStorage.getItem('clients');
    if (listRaw) {
      try {
        const list: Client[] = JSON.parse(listRaw);
        const found = list.find((c) => c.name === name);
        if (found?.dob) setDob(found.dob);
      } catch {
        /* ignore errors */
      }
    }
  }, [isNew, dob, name]);

  // Save a single note (button inside white box, bottom-right)
  const handleSaveNotes = () => {
    if (!notesInput.trim()) return;
    const updated = [...savedNotes, notesInput.trim()];
    localStorage.setItem(notesKey, JSON.stringify(updated));
    setSavedNotes(updated);
    setNotesInput('');
  };

  const handleDeleteNote = (index: number) => {
    const updated = savedNotes.filter((_, i) => i !== index);
    localStorage.setItem(notesKey, JSON.stringify(updated));
    setSavedNotes(updated);
  };

  // Save profile data (name/dob), migrate notes if name was changed
  const saveProfile = () => {
    if (!name.trim() || !dob.trim()) {
      alert('Please fill in both Name and Date of Birth.');
      return false;
    }

    const raw = localStorage.getItem('clients');
    let clients: Client[] = [];
    if (raw) {
      try {
        clients = JSON.parse(raw);
      } catch {
        clients = [];
      }
    }

    // Migrate notes: old name -> new name
    const oldName = prevNameRef.current;
    if (oldName && oldName !== name) {
      const oldKey = `clientNotes:${oldName}`;
      const newKey = `clientNotes:${name}`;
      const existingOldNotes = localStorage.getItem(oldKey);
      if (existingOldNotes && !localStorage.getItem(newKey)) {
        localStorage.setItem(newKey, existingOldNotes);
        localStorage.removeItem(oldKey);
      }
      prevNameRef.current = name;
    }

    if (isNew) {
      const idx = clients.findIndex((c) => c.name === name);
      if (idx >= 0) {
        clients[idx] = { ...clients[idx], name, dob };
      } else {
        clients.push({ name, dob });
      }
    } else {
      const targetName = initNameFromQuery || oldName || name;
      const idx = clients.findIndex((c) => c.name === targetName);
      if (idx >= 0) {
        clients[idx] = { ...clients[idx], name, dob };
      } else {
        clients.push({ name, dob });
      }
    }

    localStorage.setItem('clients', JSON.stringify(clients));
    return true;
  };

  // Outside button: save profile + (if any) save current note, then return
  const handleSaveAndReturn = () => {
    const ok = saveProfile();
    if (!ok) return;
    if (notesInput.trim()) {
      handleSaveNotes();
    }
    router.back(); // Or: router.push('/clients_list')
  };

  return (
    <div className="h-screen w-full bg-[#FAEBDC] flex flex-col items-center relative">
      {/* Top bar */}
      <div className="w-full bg-[#4A0A0A] text-white flex items-center justify-between px-6 py-4 rounded-t-lg shadow-md">
        <h2 className="text-2xl font-bold">Client Profile</h2>
        <button
          onClick={() => router.push(`/partial-dashboard?name=${encodeURIComponent(name)}&dob=${encodeURIComponent(dob)}`)}
          className="px-4 py-2 bg-[#ff9900] text-black rounded-md font-semibold hover:bg-[#e68a00] transition"
        >
          View Client Dashboard
        </button>
      </div>

      {/* Main content */}
      <div className="w-full max-w-4xl flex-1 bg-[#FAEBDC] p-8 flex flex-col gap-6">
        {/* White box: reserved space at bottom for right-bottom button */}
        <div className="bg-white rounded-lg p-8 border-2 border-[#4A0A0A] flex flex-col gap-6 relative pb-12 min-h-[400px]">
          {/* Info section */}
          <div className="flex gap-6">
            {/* Avatar placeholder */}
            <div className="flex-shrink-0 w-[100px] h-[100px] rounded-full border bg-gray-300" />

            {/* Editable profile fields */}
            <div className="flex flex-col gap-3 w-full text-black">
              {/* Name row */}
              <label className="text-lg flex items-center gap-3">
                <span className="font-semibold">Name:</span>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={isNew ? 'Enter name' : undefined}
                  className="flex-1 max-w-2xl p-2 border-2 border-[#4A0A0A] rounded-md focus:outline-none focus:ring-2 focus:ring-[#4A0A0A]"
                />
              </label>

              {/* DOB row */}
              <label className="text-lg flex items-center gap-3">
                <span className="font-semibold">Date of Birth:</span>
                <input
                  type="text" // Change to type="date" if you want native date picker
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                  placeholder={isNew ? 'e.g., 1943-09-16 or 16th September 1943' : undefined}
                  className="flex-1 max-w-2xl p-2 border-2 border-[#4A0A0A] rounded-md focus:outline-none focus:ring-2 focus:ring-[#4A0A0A]"
                />
              </label>

              <p className="text-lg font-semibold">Client Notes:</p>

              {/* Saved notes list */}
              <div className="flex flex-col gap-2">
                {savedNotes.map((note, idx) => (
                  <div
                    key={idx}
                    className="w-full p-3 border-2 border-[#4A0A0A] rounded-md bg-white text-black flex justify-between items-start"
                  >
                    <span className="whitespace-pre-line">{note}</span>
                    <button
                      onClick={() => handleDeleteNote(idx)}
                      className="ml-4 text-red-600 font-bold hover:text-red-800 transition"
                    >
                      ✖
                    </button>
                  </div>
                ))}
              </div>

              {/* Notes input box */}
              <textarea
                value={notesInput}
                onChange={(e) => setNotesInput(e.target.value)}
                placeholder="Write client notes here..."
                className="mb-6 w-full min-h-[120px] p-3 border-2 border-[#4A0A0A] rounded-md focus:outline-none focus:ring-2 focus:ring-[#4A0A0A] text-black"
              />
            </div>
          </div>

          {/* Bottom-right button inside white box: save notes only */}
          <div className="absolute bottom-4 right-4">
            <button
              onClick={handleSaveNotes}
              className="px-6 py-2 bg-[#4A0A0A] text-white rounded-md text-lg hover:bg-[#3a0808] transition"
            >
              Save Notes
            </button>
          </div>
        </div>

        {/* Outside button: save profile (and note if filled) then return */}
        <div className="flex justify-center">
          <button
            onClick={handleSaveAndReturn}
            className="px-8 py-3 bg-[#4A0A0A] text-white rounded-lg text-lg hover:bg-[#3a0808] transition"
          >
            Save and Return
          </button>
        </div>
      </div>

      {/* Help tooltip in bottom-right corner */}
      <div className="absolute bottom-8 right-8">
        <div className="relative">
          <div
            className="w-12 h-12 bg-[#ff9900] text-white rounded-full flex items-center justify-center font-bold text-xl cursor-pointer"
            onMouseEnter={(e) =>
              e.currentTarget.nextElementSibling?.classList.remove('hidden')
            }
            onMouseLeave={(e) =>
              e.currentTarget.nextElementSibling?.classList.add('hidden')
            }
          >
            ?
          </div>
          <div className="hidden absolute bottom-16 right-0 w-80 bg-white border border-gray-300 p-4 rounded shadow-lg text-sm z-50 text-black">
            <h4 className="font-semibold mb-2">How to use this page</h4>
            <ul className="list-disc pl-5 space-y-1">
              <li>Edit the client’s Name and Date of Birth above.</li>
              <li>Use &quot;Save Notes&quot; to save a note without leaving this page.</li>
              <li>&quot;Save and Return&quot; will save the profile (and current note if filled) and go back.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
