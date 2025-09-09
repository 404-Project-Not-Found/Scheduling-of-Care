// src/app/client-access/page.tsx
'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

export default function ClientAccessPage() {
  const router = useRouter();

  /* state variables */
  const [code, setCode] = useState<string>('');
  const [input, setInput] = useState<string>('');
  const [message, setMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null);
  const [codeRegistered, setCodeRegistered] = useState<boolean>(false);
  const [inputAttempted, setInputAttempted] = useState<boolean>(false);
  const [submissionMessage, setSubmissionMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null);

  /* generate new access code */
  function generateCode() {
    const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    const newCode = Array.from({ length: 8 }, () => charset[Math.floor(Math.random() * charset.length)]).join('');
    setCode(newCode);
    setCodeRegistered(false);
    setMessage({ type: 'success', text: 'Access code generated &mdash; copy it and email to management.' });
    setSubmissionMessage(null);
  }

  /* copy code to clipboard */
  async function copyCode() {
    if (!code) return;
    try {
      await navigator.clipboard.writeText(code);
      setMessage({ type: 'success', text: 'Copied to clipboard!' });
    } catch {
      setMessage({ type: 'error', text: 'Copy failed &mdash; please copy manually.' });
    }
  }

  /* verify entered access code */
  function handleVerify() {
    if (!input.trim()) {
      setSubmissionMessage({ type: 'error', text: 'Please enter a code.' });
      return;
    }
    if (code && input.trim() === code) {
      setSubmissionMessage({ type: 'success', text: 'Code accepted &mdash; client registered.' });
      setCodeRegistered(true);
    } else {
      setSubmissionMessage({ type: 'error', text: 'Invalid code.' });
    }
  }

  /* navigate to manage access page */
  function handleContinue() {
    router.push('/client-access/manage-access-code-page');
  }

  return (
    <div className="h-screen w-full bg-[#F3E9D9] text-zinc-900 flex flex-col items-center justify-start p-8 relative">
      {/* logo on the top left */}
      <div className="absolute top-8 left-8 w-64 h-32">
        <Image
          src="/logo-name.png"
          alt="Logo"
          width={256}
          height={128}
          className="object-contain"
          priority
        />
      </div>

      <div className="w-full max-w-6xl grid grid-cols-2 gap-12 mt-16">
        {/* LEFT PANEL: create access code */}
        <div className="bg-[#F7ECD9] rounded-2xl shadow-lg overflow-hidden min-h-[500px]">
          <div className="bg-[#4A0A0A] px-6 py-6">
            <h3 className="text-3xl font-bold text-white">Create Client Access Code</h3>
          </div>
          <div className="p-16">
            <p className="text-base mb-10">
              Please generate a client access code, copy it and email it to your client&apos;s organisation management
              team to register a new client.
            </p>

            {/* generate access code */}
            <div className="flex items-center gap-6">
              <button
                onClick={generateCode}
                className="bg-[#4A0A0A] text-white font-semibold text-lg cursor-pointer w-44 h-20 rounded-md hover:bg-[#3a0808] transition-colors flex flex-col items-center justify-center text-center"
              >
                <span>Generate Access</span>
                <span>Code</span>
              </button>

              <div className="flex items-center gap-3">
                <div className="min-w-[200px] px-5 py-4 bg-white rounded border text-base">
                  {code || <span className="text-slate-400">&mdash;</span>}
                </div>
                <button
                  onClick={copyCode}
                  disabled={!code}
                  className="text-base underline disabled:opacity-50 cursor-pointer"
                >
                  copy
                </button>
              </div>
            </div>

            {/* left panel messages */}
            {message && (
              <div
                className={`mt-6 p-4 rounded ${
                  message.type === 'success'
                    ? 'bg-green-50 border-green-200'
                    : 'bg-red-50 border-red-200'
                } border text-base`}
              >
                {message.text}
              </div>
            )}

            <p className="mt-10">
              <Link href="/" className="underline text-base cursor-pointer">
                Back to Login
              </Link>
            </p>
          </div>
        </div>

        {/* RIGHT PANEL: enter access code */}
        <div className="bg-[#ffd9b3] rounded-2xl p-16 shadow-lg min-h-[500px]">
          <h3 className="text-3xl font-bold mb-6">Enter Client Access Code</h3>

          {/* show warning if user typed the code but it hasn&apos;t been submitted yet */}
          {inputAttempted && input.trim() && !codeRegistered && (
            <div className="mb-4 p-3 bg-yellow-50 border border-yellow-300 rounded text-base">
              Warning: This access code has not been registered yet!
            </div>
          )}

          {/* input and button */}
          <label className="block text-base mb-3">Client Access Code</label>
          <div className="flex gap-4 mb-6">
            <input
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                setInputAttempted(true);
                setSubmissionMessage(null);
              }}
              className="flex-1 rounded px-5 py-4 border text-base focus:outline-none"
              placeholder="Enter code here"
              aria-label="Client access code"
            />
            <button
              onClick={handleVerify}
              className="rounded-md px-8 py-4 bg-[#4A0A0A] text-white text-lg cursor-pointer hover:bg-[#3a0808] transition-colors"
            >
              Enter
            </button>
          </div>

          <p className="text-base mb-6">
            Forgot access code? Contact{' '}
            <Link href="#" className="underline cursor-pointer">
              your management
            </Link>
          </p>

          {/* bottom submission message */}
          {submissionMessage && (
            <div
              className={`mt-6 p-4 rounded ${
                submissionMessage.type === 'success'
                  ? 'bg-green-50 border-green-200'
                  : 'bg-red-50 border-red-200'
              } border text-base`}
            >
              {submissionMessage.text}
            </div>
          )}

          {/* continue button navigates to manage access codes page */}
          <div className="mt-8">
            <button
              onClick={handleContinue}
              className="rounded-md px-10 py-4 bg-[#4A0A0A] text-white text-lg cursor-pointer hover:bg-[#3a0808] transition-colors"
            >
              Continue
            </button>
          </div>
        </div>
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
          <div className="hidden absolute bottom-16 right-0 w-80 bg-white border border-gray-300 p-4 rounded shadow-lg text-sm z-50">
            <h4 className="font-semibold mb-2">How to use this page</h4>
            <ul className="list-disc pl-5 space-y-1">
              <li>Click &quot;Generate Access Code&quot; to create a new client code.</li>
              <li>Copy the code and email it to your client&apos;s management team.</li>
              <li>Paste the code into the &quot;Enter Client Access Code&quot; box.</li>
              <li>If you enter a code that hasn&apos;t been registered yet, a warning will appear at the top.</li>
              <li>Click &quot;Enter&quot; to register the code. You&apos;ll see a confirmation or error message below.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
