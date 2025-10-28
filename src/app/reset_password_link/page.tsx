/**
 * File path: /reset_password_link/page.tsx
 * Front-end Author: Devni Wijesinghe
 * Back-end Author: Denise Alexander
 * Date Created: 17/09/2025
 */

'use client';

import { Info } from 'lucide-react';
import React, { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

export default function ResetPasswordEmailPage() {
  const [email, setEmail] = useState<string>('');
  const [submitted, setSubmitted] = useState<boolean>(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      alert('Please enter a valid email address.');
      return;
    }

    try {
      const res = await fetch('/api/v1/request_reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();
      console.log(data);
      setSubmitted(true);
    } catch (err) {
      console.error(err);
      alert('Something went wrong. Please try again.');
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#FAEBDC] text-zinc-900 flex flex-col">
      {/* Logo */}
      <div className="flex items-center gap-4 flex-wrap px-8 pt-8">
        <Image
          src="/logo-name.png"
          alt="Logo"
          width={220}
          height={220}
          className="object-contain"
          priority
        />
      </div>

      {/* Centered Content */}
      <div className="flex flex-col items-center justify-center flex-1 w-full px-8">
        {/* Page title */}
        <h1 className="text-4xl sm:text-4xl font-extrabold tracking-tight text-[#3A0000] mb-8 text-center w-full">
          Reset Password
        </h1>

        {/* Success banner */}
        {submitted && (
          <div
            role="alert"
            className="fixed top-0 left-0 w-full bg-[#DCF4D9] text-[#1B4B1B] px-6 py-4 text-center font-semibold shadow-md z-50"
          >
            If an account with <b>{email}</b> exists, a reset link has been sent
            to this account.
          </div>
        )}

        {/* Form Section */}
        {!submitted && (
          <form
            onSubmit={handleSubmit}
            className="w-full max-w-lg bg-[#F7ECD9]/60 border border-[#3A0000]/30 rounded-xl shadow-sm py-10 px-8 space-y-10"
          >
            {/* Instructions */}
            <div className="w-full bg-[#F9C9B1]/70 border border-[#3A0000]/30 rounded-xl shadow-sm py-5 px-6 flex items-start gap-4">
              <Info
                size={30}
                strokeWidth={2.5}
                className="text-[#3A0000] flex-shrink-0 mt-1"
              />
              <div className="text-[#3A0000] text-left">
                <h3 className="text-lg font-semibold mb-2">Instructions</h3>
                <p className="text-base leading-relaxed">
                  Enter your{' '}
                  <span className="font-semibold">account email</span> below and
                  click{' '}
                  <span className="font-semibold">
                    &quot;Request Reset Link&quot;
                  </span>
                  . You’ll receive an email with further instructions to reset
                  your password.
                </p>
              </div>
            </div>

            {/* Email Input */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5">
              <label
                htmlFor="email"
                className="text-[20px] font-medium whitespace-nowrap"
              >
                Enter Email Address <span className="text-red-600">*</span>
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1 rounded-md border border-[#3A000] bg-white px-4 py-2.5 text-lg min-w-[200px]"
                required
              />
            </div>

            {/* Submit Button */}
            <div className="flex flex-col items-center pt-4">
              <button
                type="submit"
                className="rounded-full bg-[#4A0A0A] text-white text-xl font-semibold px-10 py-3 transition hover:opacity-95"
              >
                Request Reset Link
              </button>
            </div>
          </form>
        )}

        {/* Back link */}
        <p className="text-center text-lg mt-4">
          Remembered your password?{' '}
          <button
            type="button"
            onClick={() => router.push('/')}
            className="underline font-bold text-[#4A0A0A]"
          >
            Back to Login
          </button>
        </p>
      </div>
    </div>
  );
}
