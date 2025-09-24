'use client';

import React, { useEffect, useState } from 'react';

/** Shared palette to match your app */
const palette = {
  canvas: '#FAEBDC',
  header: '#3A0000',
  text: '#2b2b2b',
  accent: '#ff9999',
  btn: '#3A0000',
  inputBorder: '#602222',
  notice: '#F9C9B1',
};

/**
 * Right-side sliding panel used inside Client Profile page.
 * Width: full on mobile, half screen (sm+) on larger viewports.
 */
export default function AddAccessCodePanel({
  onClose,
}: {
  onClose: () => void;
}) {
  const [code, setCode] = useState('');
  const [copied, setCopied] = useState<null | 'ok' | 'err'>(null);
  const [showTip, setShowTip] = useState(false);

  // Close on ESC key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  // Generate an 8-character random access code
  function generateCode() {
    const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
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
      className="h-full flex flex-col"
      style={{ backgroundColor: palette.canvas }}
    >
      {/* Header (match Client Profile / Dashboard) */}
      <div
        className="w-full flex items-center justify-center px-6 py-4 relative"
        style={{ backgroundColor: palette.header, color: '#fff' }}
      >
        {/* 标题居中 */}
        <h2 className="text-2xl font-bold">Create new Access Code</h2>

        {/* Close button on the right */}
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute right-4 top-1/2 -translate-y-1/2 rounded px-2 py-1 text-lg hover:opacity-90 focus:outline-none"
        >
          ✕
        </button>
      </div>

      {/* Notice (banner) */}
      <div
        className="w-full px-6 md:px-8 py-5 md:py-6"
        style={{ backgroundColor: palette.notice }}
      >
        <p
          className="text-sm sm:text-base md:text-lg leading-relaxed"
          style={{ color: '#000' }}
        >
          IMPORTANT: Generate an access code, copy it, and email it to the care
          organisation management team together with the person’s name so they
          can create the client record.
        </p>
      </div>

      {/* Main content */}
      <section className="flex-1 flex flex-col items-center justify-start">
        <div className="mt-16 flex items-center justify-center gap-4 sm:gap-5 flex-wrap">
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
                className="absolute left-1/2 -translate-x-1/2 mt-2 w-64 text-sm p-3 rounded shadow-md z-10 bg-white"
                style={{ color: palette.text, border: '1px solid #e5e7eb' }}
              >
                Share this access code with the care organisation. They will use
                it with the family member’s name to create the client record.
              </div>
            )}
          </div>

          {/* Read-only input */}
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

          {/* Copy link + feedback */}
          <button
            onClick={copyCode}
            className="underline text-lg"
            style={{ color: palette.header }}
            disabled={!code}
          >
            copy
          </button>
          {copied && (
            <span
              className={`text-sm ${copied === 'ok' ? 'text-green-700' : 'text-red-600'}`}
            >
              {copied === 'ok' ? 'Copied!' : 'Copy failed'}
            </span>
          )}
        </div>
      </section>
    </div>
  );
}
