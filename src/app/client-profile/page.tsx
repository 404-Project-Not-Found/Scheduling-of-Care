"use client";

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

type Client = { name: string; dob: string; notes?: string[] };

const colors = {
  pageBg: "#ffd9b3",
  cardBg: "#F7ECD9",
  header: "#4A0A0A",
  text: "#2b2b2b",
  buttonBg: "#4A0A0A",
  buttonHover: "#3a0808",
  help: "#ed5f4f",
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

  const isNew = searchParams.get('new') === 'true';
  const initNameFromQuery = searchParams.get('name') || '';
  const initDobFromQuery = searchParams.get('dob') || '';

  const [name, setName] = useState<string>(isNew ? '' : initNameFromQuery || 'Florence Edwards');
  const [dob, setDob] = useState<string>(isNew ? '' : initDobFromQuery || '16th September 1943');
  const prevNameRef = useRef<string>(name);

  const notesKey = `clientNotes:${name}`;
  const [notesInput, setNotesInput] = useState<string>('');
  const [savedNotes, setSavedNotes] = useState<string[]>([]);

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

  useEffect(() => {
    setSavedNotes(loadNotesByName(name));
  }, [name]);

  useEffect(() => {
    if (isNew || dob) return;
    const listRaw = localStorage.getItem('clients');
    if (listRaw) {
      try {
        const list: Client[] = JSON.parse(listRaw);
        const found = list.find((c) => c.name === name);
        if (found?.dob) setDob(found.dob);
      } catch {}
    }
  }, [isNew, dob, name]);

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
      if (idx >= 0) clients[idx] = { ...clients[idx], name, dob };
      else clients.push({ name, dob });
    } else {
      const targetName = initNameFromQuery || oldName || name;
      const idx = clients.findIndex((c) => c.name === targetName);
      if (idx >= 0) clients[idx] = { ...clients[idx], name, dob };
      else clients.push({ name, dob });
    }

    localStorage.setItem('clients', JSON.stringify(clients));
    return true;
  };

  const handleSaveAndReturn = () => {
    const ok = saveProfile();
    if (!ok) return;
    if (notesInput.trim()) handleSaveNotes();
    router.back();
  };

  return (
    <div className="h-screen w-full" style={{ backgroundColor: colors.pageBg }}>
      {/* Top bar */}
      <div
        className="w-full flex items-center justify-between px-6 py-4 rounded-t-lg shadow-md"
        style={{ backgroundColor: colors.header, color: 'white' }}
      >
        <h2 className="text-2xl font-bold">Client Profile</h2>
        <button
          onClick={() => router.push('/dashboard')}
          className="px-6 py-2 rounded-full font-medium hover:bg-[#3a0808] transition"
          style={{ backgroundColor: colors.buttonBg, color: 'white' }}
        >
          View Client Dashboard
        </button>
      </div>

      {/* Main content */}
      <div className="w-full max-w-4xl mx-auto p-8 flex flex-col gap-6">
        <div
          className="bg-white rounded-lg p-8 border-2 border-[#4A0A0A] flex flex-col gap-6 relative pb-12 min-h-[400px]"
          style={{ color: colors.text }}
        >
          <div className="flex gap-6">
            <div className="flex-shrink-0 w-[100px] h-[100px] rounded-full border bg-gray-300" />
            <div className="flex flex-col gap-3 w-full">
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

              <label className="text-lg flex items-center gap-3">
                <span className="font-semibold">Date of Birth:</span>
                <input
                  type="text"
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                  placeholder={isNew ? 'e.g., 16th September 1943' : undefined}
                  className="flex-1 max-w-2xl p-2 border-2 border-[#4A0A0A] rounded-md focus:outline-none focus:ring-2 focus:ring-[#4A0A0A]"
                />
              </label>

              <p className="text-lg font-semibold">Client Notes:</p>
              <div className="flex flex-col gap-2">
                {savedNotes.map((note, idx) => (
                  <div
                    key={idx}
                    className="w-full p-3 border-2 border-[#4A0A0A] rounded-md bg-white flex justify-between items-start"
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

              <textarea
                value={notesInput}
                onChange={(e) => setNotesInput(e.target.value)}
                placeholder="Write client notes here..."
                className="mb-6 w-full min-h-[120px] p-3 border-2 border-[#4A0A0A] rounded-md focus:outline-none focus:ring-2 focus:ring-[#4A0A0A]"
              />
            </div>
          </div>

          {/* Bottom-right Save Notes */}
          <div className="absolute bottom-4 right-4">
            <button
              onClick={handleSaveNotes}
              className="px-6 py-2 rounded-md text-white hover:bg-[#3a0808] transition"
              style={{ backgroundColor: colors.buttonBg }}
            >
              Save Notes
            </button>
          </div>
        </div>

        {/* Outside Save and Return */}
        <div className="flex justify-center">
          <button
            onClick={handleSaveAndReturn}
            className="px-8 py-3 rounded-lg text-white hover:bg-[#3a0808] transition"
            style={{ backgroundColor: colors.buttonBg }}
          >
            Save and Return
          </button>
        </div>
      </div>

      {/* Help Button */}
      <div className="absolute bottom-8 right-8">
        <div className="relative group">
          <button
            className="w-12 h-12 bg-[#ed5f4f] text-white rounded-full flex items-center justify-center font-bold text-xl"
          >
            ?
          </button>
          <div className="absolute hidden group-hover:block bottom-16 right-0 w-80 bg-white border border-gray-300 p-4 rounded shadow-lg text-sm text-black z-50">
            <h4 className="font-semibold mb-2">How to use this page</h4>
            <ul className="list-disc pl-5 space-y-1">
              <li>Edit the client’s Name and Date of Birth above.</li>
              <li>Use &quot;Save Notes&quot; to save a note without leaving this page.</li>
              <li>&quot;Save and Return&quot; will save the profile (and current note if filled) and go back.</li>
              <li>&quot;View Client Dashboard&quot; takes you to the main dashboard.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
