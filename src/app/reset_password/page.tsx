/**
 * File path: /reset_password/page.client.tsx
 * Front-end Author: Devni Wijesinghe
 * Back-end Author: Denise Alexander
 * Date Created: 17/09/2025
 */

'use client';

import { Info } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

export default function ResetPasswordPage() {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);
  const [notificationType, setNotificationType] = useState<'success' | 'error'>(
    'success'
  );
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const t = params.get('token');
    setToken(t);
  }, []);

  if (token === null) {
    return <div className="text-center mt-20">Loading...</div>;
  }

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || !confirmPassword) {
      setNotification('Please fill in both fields.');
      setNotificationType('error');
      return;
    }
    if (newPassword !== confirmPassword) {
      setNotification('Passwords do not match.');
      setNotificationType('error');
      return;
    }
    if (!token) {
      setNotification('Invalid reset link.');
      setNotificationType('error');
      return;
    }
    try {
      const res = await fetch('/api/v1/reset_password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword }),
      });

      const data = await res.json();
      if (res.ok) {
        setNotification(data.message);
        setNotificationType('success');
        setNewPassword('');
        setConfirmPassword('');
        setShowNew(false);
        setShowConfirm(false);
      } else {
        setNotification(data.error);
        setNotificationType('error');
      }
    } catch (err) {
      console.error(err);
      setNotification('Something went wrong.');
      setNotificationType('error');
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

        {/* Notification banner */}
        {notification && (
          <div
            role="alert"
            className={`w-full max-w-lg mb-8 text-center py-3 px-6 rounded-md font-semibold shadow-md ${
              notificationType === 'success'
                ? 'bg-[#DCF4D9] text-[#1B4B1B]'
                : 'bg-red-100 text-[#4A0A0A]'
            }`}
          >
            {notification}
          </div>
        )}

        {/* Form */}
        <form
          onSubmit={handleReset}
          className="w-full max-w-lg bg-white/80 border border-[#3A0000]/30 rounded-xl shadow-sm py-10 px-8 space-y-10"
        >
          {/* Instructions */}
          <div className="w-full bg-[#F9C9B1]/70 border border-[#3A0000]/30 rounded-xl shadow-sm py-5 px-6 flex items-start gap-4">
            <Info
              size={28}
              strokeWidth={2.5}
              className="text-[#3A0000] flex-shrink-0 mt-1"
            />
            <div className="text-[#3A0000] text-left">
              <h3 className="text-lg font-semibold mb-1">Instructions</h3>
              <p className="text-base leading-relaxed">
                Please enter and confirm your new password below. Make sure it
                is at least{' '}
                <span className="font-semibold">12 characters long</span> and
                includes a mix of upper and lower case letters, numbers and
                symbols.
              </p>
            </div>
          </div>

          {/* Password fields */}
          <div className="flex flex-col gap-8">
            {/* New Password */}
            <div className="flex flex-col gap-2">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5">
                <label
                  htmlFor="newPassword"
                  className="text-[20px] font-medium whitespace-nowrap sm:w-48"
                >
                  New Password <span className="text-red-600">*</span>
                </label>

                <div className="flex items-center gap-3 flex-1">
                  <input
                    id="newPassword"
                    type={showNew ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full rounded-md border border-[#6E1B1B] bg-white px-4 py-2.5 text-lg"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowNew(!showNew)}
                    className="underline text-[16px] text-[#4A0A0A] hover:opacity-80 whitespace-nowrap"
                  >
                    {showNew ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>
            </div>

            {/* Confirm Password */}
            <div className="flex flex-col gap-2">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5">
                <label
                  htmlFor="confirmPassword"
                  className="text-[20px] font-medium whitespace-nowrap sm:w-48"
                >
                  Confirm Password <span className="text-red-600">*</span>
                </label>

                <div className="flex items-center gap-3 flex-1">
                  <input
                    id="confirmPassword"
                    type={showConfirm ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full rounded-md border border-[#6E1B1B] bg-white px-4 py-2.5 text-lg"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="underline text-[16px] text-[#4A0A0A] hover:opacity-80 whitespace-nowrap"
                  >
                    {showConfirm ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Reset Button */}
          <div className="flex flex-col items-center pt-4">
            <button
              type="submit"
              className="rounded-full bg-[#4A0A0A] text-white text-xl font-semibold px-10 py-3 transition hover:opacity-95"
            >
              Reset Password
            </button>
          </div>
        </form>

        {/* Back to login */}
        <p className="text-center text-lg mt-6">
          Back to{' '}
          <button
            onClick={() => router.push('/')}
            className="underline font-bold text-[#4A0A0A]"
          >
            Login
          </button>
        </p>
      </div>
    </div>
  );
}
