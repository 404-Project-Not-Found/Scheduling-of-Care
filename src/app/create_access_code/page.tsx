'use client';

export const dynamic = 'force-dynamic';

import React, { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

const palette = {
  canvas: '#F7ECD9', // Page background
  header: '#3A0000', // Dark brown header bar
  text: '#2b2b2b', // Default black text
  accent: '#ff9999', // Info dot color
  btn: '#3A0000', // Main button color
  inputBorder: '#602222', // Input border color
  notice: '#F9C9B1', // notice bar background
  question: '#ff9900', // Help bubble background
};

export default function AddFamilyMemberFullPage() {
  const router = useRouter();
  const [code, setCode] = useState('');
  const [copied, setCopied] = useState<null | 'ok' | 'err'>(null);
  const [showTip, setShowTip] = useState(false);

  // Generate an 8-character random access code
  function generateCode() {
    const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Removed confusing chars
    let out = '';
    for (let i = 0; i < 8; i++)
      out += CHARS[Math.floor(Math.random() * CHARS.length)];
    setCode(out);
    setCopied(null);
  }

  // Copy access code to clipboard
  async function copyCode() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied('ok');
      setTimeout(() => setCopied(null), 1500);
    } catch {
      setCopied('err');
      setTimeout(() => setCopied(null), 1500);
    }
  }

  return (
    <div
      className="min-h-screen w-full flex flex-col"
      style={{ backgroundColor: palette.canvas }}
    >
      {/* === Top bar with logo (left side only) === */}
      <div className="px-6 py-4">
        <Image
          src="/logo-name.png"
          alt="Scheduling of Care"
          width={180}
          height={44}
          className="object-contain"
          priority
        />
      </div>

      {/* === Dark brown header bar with Back (left) and title (center) === */}
      <div
        className="w-full relative flex items-center justify-center py-4"
        style={{ backgroundColor: palette.header, color: 'white' }}
      >
        {/* Back button on the far left */}
        <button
          onClick={() => window.history.back()}
          className="absolute left-4 flex items-center gap-2 text-white hover:opacity-90 focus:outline-none"
          aria-label="Back"
          title="Back"
        >
          {/* SVG arrow */}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M15 18l-6-6 6-6" />
          </svg>
          <span className="text-lg">Back</span>
        </button>

        {/* Page title centered */}
        <h1 className="text-3xl font-bold">Create a New Access Code</h1>
      </div>

      {/* === Pink notice bar with instructions === */}
      <div
        className="w-full py-4 px-6"
        style={{ backgroundColor: palette.notice }}
      >
        <p className="text-base sm:text-lg md:text-xl font-semibold text-black leading-relaxed text-left">
          IMPORTANT: To add a new person with special needs in this system,
          please generate an access code, copy it and paste it in the access
          code field when filling out{' '}
          <button
            type="button"
            onClick={() => router.push('/client_profile?new=true')}
            className="underline font-bold"
            style={{ color: palette.header }}
          >
            Add New Person.
          </button>{' '}
          After you&apos;ve added the person, to add the person&apos;s acoount
          to an organisation, please email the access code and the person&apos;s
          name to the person&apos;s care management team.
        </p>
      </div>

      {/* === Main action area === */}
      <section className="flex-1 flex flex-col items-center justify-start">
        <div className="mt-24 flex items-center justify-center gap-4 sm:gap-5 flex-wrap">
          {/* Generate button */}
          <button
            onClick={generateCode}
            className="rounded-full px-6 sm:px-7 py-3 text-white text-lg font-semibold shadow-sm active:translate-y-[1px]"
            style={{ backgroundColor: palette.btn }}
          >
            Generate Access Code
          </button>

          {/* Info dot with tooltip */}
          <div
            className="relative"
            onMouseEnter={() => setShowTip(true)}
            onMouseLeave={() => setShowTip(false)}
          >
            <div
              className="w-6 h-6 rounded-full text-white flex items-center justify-center font-bold cursor-default select-none"
              style={{ backgroundColor: palette.accent }}
              aria-label="Info"
              title="Info"
            >
              i
            </div>
            {showTip && (
              <div
                className="absolute left-1/2 -translate-x-1/2 mt-2 w-64 text-sm p-3 rounded shadow-md z-10"
                style={{
                  backgroundColor: 'white',
                  color: palette.text,
                  border: '1px solid #e5e7eb',
                }}
              >
                Share this access code with the care organisation. They will use
                it with the family member’s name to create the client record.
              </div>
            )}
          </div>

          {/* Read-only input box */}
          <input
            value={code}
            readOnly
            className="h-10 w-44 text-lg text-center rounded border outline-none"
            style={{
              borderColor: palette.inputBorder,
              color: palette.text,
              background: 'white',
            }}
          />

          {/* Copy link */}
          <button
            onClick={copyCode}
            className="underline text-lg"
            style={{ color: palette.header }}
            disabled={!code}
          >
            copy
          </button>

          {/* Copy feedback */}
          {copied && (
            <span
              className={`text-sm ${copied === 'ok' ? 'text-green-700' : 'text-red-600'}`}
            >
              {copied === 'ok' ? 'Copied!' : 'Copy failed'}
            </span>
          )}
        </div>
      </section>

      {/* === New bottom button === */}
      <div className="w-full flex justify-center mt-12 mb-20">
        <button
          onClick={() => router.push('/client_profile?new=true')}
          className="px-6 py-4 text-center rounded-xl text-base sm:text-lg md:text-xl"
          style={{ color: palette.header }}
        >
          Already have an access code for someone you know (family member or
          client)? <br />
          <span className="underline">
            Add the person to your list of people here
          </span>
        </button>
      </div>

      {/* === Help bubble === */}
      <HelpBubble />
    </div>
  );
}

/* Floating help bubble component */
function HelpBubble() {
  const [open, setOpen] = useState(false);
  return (
    <div className="fixed bottom-6 right-6">
      <div
        className="w-10 h-10 rounded-full text-white font-bold text-xl flex items-center justify-center cursor-pointer select-none"
        style={{ backgroundColor: '#ff9900' }}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        aria-label="Help"
        title="Help"
      >
        ?
      </div>
      {open && (
        <div className="absolute bottom-12 right-0 w-80 bg-white border border-gray-300 p-4 rounded shadow-lg text-sm z-10">
          <h4 className="font-semibold mb-2">How to use this page</h4>
          <ul className="list-disc pl-5 space-y-1">
            <li>
              Click <b>Generate Access Code</b> to create a new code.
            </li>
            <li>Share the code with the care organisation via email.</li>
            <li>
              They will register the family member using the code and name.
            </li>
          </ul>
        </div>
      )}
    </div>
  );
}
