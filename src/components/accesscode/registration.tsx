/**
 * Filename: /components/accesscode/Registration.tsx
 * Author: Qingyue Zhao
 * Date Created: 02/10/2025
 *
 * Description:
 * Right-side sliding panel for registering a new client.
 * - Layout identical to AddAccessCodePanel.
 * - Notice bar text replaced with client registration instruction.
 * - Blocks background scrolling when open, closes on ESC key or overlay click.
 */

'use client';

import React, { useEffect, useState } from 'react';

const palette = {
  canvas: '#FAEBDC',
  header: '#3A0000',
  text: '#2b2b2b',
  accent: '#ff9999',
  btn: '#3A0000',
  inputBorder: '#602222',
  notice: '#F9C9B1',
};

export default function RegisterClientPanel({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [accessCode, setAccessCode] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessCode.trim()) {
      setError('Access code cannot be empty.');
      return;
    }
    setError(null);
    // TODO: backend request
    console.log('Submitting access code:', accessCode);
  };

  return (
    <>
      <button
        aria-label="Close overlay"
        onClick={onClose}
        className={`fixed inset-0 z-[90] bg-black/40 transition-opacity duration-300 ${
          open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      />

      <aside
        aria-label="Register client panel"
        role="dialog"
        aria-modal="true"
        className={`
          fixed top-0 right-0 z-[100] h-screen w-1/2
          transform transition-transform duration-300 ease-out
          ${open ? 'translate-x-0' : 'translate-x-full'}
          shadow-2xl flex flex-col
        `}
        style={{ backgroundColor: palette.canvas }}
      >
        {/* Header */}
        <div
          className="w-full flex items-center justify-center px-6 py-4 relative"
          style={{ backgroundColor: palette.header, color: '#fff' }}
        >
          <h2 className="text-2xl font-bold">Register New Client</h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="absolute right-4 top-1/2 -translate-y-1/2 rounded px-2 py-1 text-lg hover:opacity-90 focus:outline-none"
          >
            ✕
          </button>
        </div>

        {/* Notice bar */}
        <div
            className="w-full px-6 md:px-8 py-5 md:py-6"
            style={{ backgroundColor: palette.notice }}
            >
            <p className="text-sm sm:text-base md:text-lg leading-relaxed text-black">
                <span className="font-bold">Notice:</span>{' '}
                Please request a client access code from the family member in charge of the client’s account to register a new client. 
                Once registered, the system will automatically send an access request to the client’s family member/POA. 
                After their approval, you will be able to access all information related to that client.
            </p>
        </div>

        {/* Body */}
        <section className="flex-1 flex flex-col items-center justify-start">
          <form
            onSubmit={handleSubmit}
            className="mt-16 flex flex-col items-center justify-center gap-5 w-full max-w-md"
          >
            <input
              value={accessCode}
              onChange={(e) => setAccessCode(e.target.value)}
              placeholder="Enter access code"
              className="h-12 w-full text-lg text-center rounded border outline-none"
              style={{ borderColor: palette.inputBorder, color: palette.text, background: 'white' }}
            />

            {error && (
              <span className="text-sm text-red-600">{error}</span>
            )}

            <button
              type="submit"
              className="rounded-full px-6 sm:px-7 py-3 text-white text-lg font-semibold shadow-sm active:translate-y-[1px]"
              style={{ backgroundColor: palette.btn }}
            >
              Register
            </button>
          </form>
        </section>
      </aside>
    </>
  );
}
