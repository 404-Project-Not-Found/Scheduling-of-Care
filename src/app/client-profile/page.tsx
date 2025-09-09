'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ClientProfilePage() {
  const router = useRouter();
  const [notes, setNotes] = useState<string>('');
  const [savedNotes, setSavedNotes] = useState<string[]>([]);

  // Load saved notes from localStorage on mount
  useEffect(() => {
    const storedNotes = localStorage.getItem('clientNotes');
    if (storedNotes) {
      try {
        const parsed = JSON.parse(storedNotes);
        if (Array.isArray(parsed)) {
          setSavedNotes(parsed);
        } else {
          setSavedNotes([storedNotes]);
        }
      } catch {
        setSavedNotes([storedNotes]);
      }
    }
  }, []);

  const handleSave = () => {
    if (!notes.trim()) return;
    const updatedNotes = [...savedNotes, notes.trim()];
    localStorage.setItem('clientNotes', JSON.stringify(updatedNotes));
    setSavedNotes(updatedNotes);
    setNotes('');
  };

  const handleDelete = (index: number) => {
    const updatedNotes = savedNotes.filter((_, i) => i !== index);
    localStorage.setItem('clientNotes', JSON.stringify(updatedNotes));
    setSavedNotes(updatedNotes);
  };

  return (
    <div className="h-screen w-full bg-[#FAEBDC] flex flex-col items-center relative">
      {/* Top bar */}
      <div className="w-full bg-[#4A0A0A] text-white flex items-center justify-between px-6 py-4 rounded-t-lg shadow-md">
        <h2 className="text-2xl font-bold">Client Profile</h2>
        <button
          onClick={() => router.push('/partial-dashboard')}
          className="px-4 py-2 bg-[#ff9900] text-black rounded-md font-semibold hover:bg-[#e68a00] transition"
        >
          Back to Dashboard
        </button>
      </div>

      {/* Main content */}
      <div className="w-full max-w-4xl flex-1 bg-[#FAEBDC] p-8 flex flex-col gap-6">
        <div className="bg-white rounded-lg p-8 border-2 border-[#4A0A0A] flex gap-6">
          {/* Profile picture */}
          <div className="flex-shrink-0 w-[100px] h-[100px] rounded-full border bg-gray-300" />

          {/* Profile details */}
          <div className="flex flex-col gap-2 w-full text-black">
            <p className="text-lg">
              <span className="font-semibold">Name:</span> Florence Edwards
            </p>
            <p className="text-lg">
              <span className="font-semibold">Date of Birth:</span> 16<sup>th</sup> September 1943
            </p>

            <p className="text-lg font-semibold mt-4">Client Notes:</p>

            {/* saved notes */}
            <div className="flex flex-col gap-2">
              {savedNotes.map((note, idx) => (
                <div
                  key={idx}
                  className="w-full p-3 border-2 border-[#4A0A0A] rounded-md bg-white text-black flex justify-between items-start"
                >
                  <span className="whitespace-pre-line">{note}</span>
                  <button
                    onClick={() => handleDelete(idx)}
                    className="ml-4 text-red-600 font-bold hover:text-red-800 transition"
                  >
                    ✖
                  </button>
                </div>
              ))}
            </div>

            {/* editable input */}
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Write client notes here..."
              className="mt-4 w-full min-h-[100px] p-3 border-2 border-[#4A0A0A] rounded-md focus:outline-none focus:ring-2 focus:ring-[#4A0A0A] text-black"
            />
          </div>
        </div>

        {/* Save button */}
        <button
          onClick={handleSave}
          className="px-8 py-3 bg-[#4A0A0A] text-white rounded-lg text-lg hover:bg-[#3a0808] transition self-start"
        >
          Save Notes
        </button>
      </div>

      {/* HELP BUTTON bottom-right */}
      <div className="absolute bottom-8 right-8">
        <div className="relative">
          <div
            className="w-12 h-12 bg-[#ff9900] text-white rounded-full flex items-center justify-center font-bold text-xl cursor-pointer"
            onMouseEnter={(e) => e.currentTarget.nextElementSibling?.classList.remove('hidden')}
            onMouseLeave={(e) => e.currentTarget.nextElementSibling?.classList.add('hidden')}
          >
            ?
          </div>
          <div className="hidden absolute bottom-16 right-0 w-80 bg-white border border-gray-300 p-4 rounded shadow-lg text-sm z-50 text-black">
            <h4 className="font-semibold mb-2">How to use this page</h4>
            <ul className="list-disc pl-5 space-y-1">
              <li>Write client notes in the text area under "Client Notes".</li>
              <li>Click "Save Notes" to add the note permanently under Client Notes.</li>
              <li>You can add multiple notes; they will appear in order.</li>
              <li>Click ✖ next to a note to delete it permanently.</li>
              <li>Use the "Back to Dashboard" button to return to the partial dashboard.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
