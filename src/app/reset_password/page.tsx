/**
 * File path: /reset_password/page.tsx
 * Front-end Authors: Devni Wijesinghe & Qingyue Zhao
 * Back-end Author: Denise Alexander
 * Date Created: 17/09/2025
 */

'use client';

import { Info } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

type PwCheck = {
  score: 0 | 1 | 2 | 3 | 4; // password strength score (0=very weak, 4=very strong)
  label: 'Very weak' | 'Weak' | 'Fair' | 'Strong' | 'Very strong'; // human-readable label
  color: string; // bar color depending on score
  messages: string[]; // suggestions for improvement
  checks: {
    // detailed boolean checks for visual checklist
    len12: boolean;
    lower: boolean;
    upper: boolean;
    digit: boolean;
    symbol: boolean;
    noNameOrEmail: boolean;
    noCommonSeq: boolean;
  };
};

// Local password strength evaluation (basic rules, no external libs)
function evaluatePassword(
  pw: string,
  email: string,
  fullName: string
): PwCheck {
  const lower = /[a-z]/.test(pw);
  const upper = /[A-Z]/.test(pw);
  const digit = /\d/.test(pw);
  const symbol = /[^A-Za-z0-9]/.test(pw);
  const len12 = pw.length >= 12;

  // Avoid including name or email inside password
  const nameParts = fullName.toLowerCase().split(/\s+/).filter(Boolean);
  const emailLocal = (email.split('@')[0] || '').toLowerCase();
  const pwLower = pw.toLowerCase();
  const containsName = nameParts.some(
    (p) => p.length >= 3 && pwLower.includes(p)
  );
  const containsEmailLocal =
    emailLocal.length >= 3 && pwLower.includes(emailLocal);
  const noNameOrEmail = !(containsName || containsEmailLocal);

  // Avoid common weak sequences
  const commonSeqs = [
    '12345',
    '123456',
    'qwerty',
    'password',
    'abc123',
    '1111',
    '0000',
    'letmein',
  ];
  const noCommonSeq = !commonSeqs.some((s) => pwLower.includes(s));

  // Scoring system
  let score = 0;
  if (len12) score++;
  if (lower && upper) score++;
  if (digit) score++;
  if (symbol) score++;
  if (noNameOrEmail && noCommonSeq) score++;
  if (score > 4) score = 4;

  const labels: PwCheck['label'][] = [
    'Very weak',
    'Weak',
    'Fair',
    'Strong',
    'Very strong',
  ];
  const colors = ['#B91C1C', '#DC2626', '#D97706', '#15803D', '#166534'];

  // Improvement suggestions
  const messages: string[] = [];
  if (!len12) messages.push('Use at least 12 characters.');
  if (!(lower && upper)) messages.push('Mix UPPER and lower case letters.');
  if (!digit) messages.push('Add at least one number.');
  if (!symbol) messages.push('Add at least one symbol (e.g., !@#$%).');
  if (!noNameOrEmail)
    messages.push('Avoid using your name or email in the password.');
  if (!noCommonSeq)
    messages.push('Avoid common sequences like "123456" or "password".');

  return {
    score: score as PwCheck['score'],
    label: labels[score],
    color: colors[score],
    messages,
    checks: { len12, lower, upper, digit, symbol, noNameOrEmail, noCommonSeq },
  };
}

export default function ResetPasswordPage() {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);
  const [notificationType, setNotificationType] = useState<'success' | 'error'>(
    'success'
  );
  const [token, setToken] = useState<string | null>(null);

  // Track whether user has started typing
  const [pwTouched, setPwTouched] = useState(false);
  const [confirmTouched, setConfirmTouched] = useState(false);

  // Password strength check
  const [pwCheck, setPwCheck] = useState<PwCheck>(() =>
    evaluatePassword('', '', '')
  );

  const router = useRouter();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setToken(params.get('token'));
  }, []);

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  // Update password strength dynamically
  useEffect(() => {
    setPwCheck(evaluatePassword(newPassword, '', ''));
  }, [newPassword]);

  if (token === null)
    return <div className="text-center mt-20">Loading...</div>;

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

  // Helper component: green check or red cross
  const Check = ({ ok }: { ok: boolean }) => (
    <span
      className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-white text-xs font-bold ${ok ? 'bg-[#15803D]' : 'bg-[#DC2626]'}`}
    >
      {ok ? '✓' : '✕'}
    </span>
  );

  // Derived states
  const mismatch =
    confirmPassword.length > 0 && newPassword !== confirmPassword;
  const mismatchVisible = confirmTouched && mismatch;
  const canSubmit = pwCheck.score >= 3 && !mismatch;

  return (
    <div className="min-h-screen w-full bg-[#FAEBDC] text-zinc-900 flex flex-col">
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

      <div className="flex flex-col items-center justify-center flex-1 w-full px-8">
        <h1 className="text-4xl font-extrabold tracking-tight text-[#3A0000] mb-8 text-center w-full">
          Reset Password
        </h1>

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

          {/* New Password Field */}
          <div className="flex flex-col gap-2">
            <label htmlFor="newPassword" className="text-[20px] font-medium">
              New Password <span className="text-red-600">*</span>
            </label>
            <div className="relative w-full">
              <input
                id="newPassword"
                type={showNew ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                onFocus={() => setPwTouched(true)}
                className="w-full rounded-md border border-[#6E1B1B] bg-white px-4 py-2.5 text-lg"
                required
              />
              <button
                type="button"
                onClick={() => setShowNew((v) => !v)}
                className="underline absolute right-3 top-1/2 -translate-y-1/2 text-[16px] text-[#4A0A0A]"
              >
                {showNew ? 'Hide' : 'Show'}
              </button>
            </div>

            {pwTouched && newPassword.length > 0 && (
              <>
                {/* Strength bar */}
                <div className="mt-2">
                  <div className="w-full h-2 rounded bg-[#EADBC6] overflow-hidden">
                    <div
                      className="h-2 rounded transition-all"
                      style={{
                        width: `${(pwCheck.score / 4) * 100}%`,
                        backgroundColor: pwCheck.color,
                      }}
                    />
                  </div>
                  <div
                    className="mt-1 text-sm"
                    style={{ color: pwCheck.color }}
                  >
                    Strength:{' '}
                    <span className="font-semibold">{pwCheck.label}</span>
                  </div>
                </div>

                {/* Checklist */}
                <ul className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                  <li className="flex items-center gap-2">
                    <Check ok={pwCheck.checks.len12} /> At least 12 characters
                  </li>
                  <li className="flex items-center gap-2">
                    <Check ok={pwCheck.checks.lower && pwCheck.checks.upper} />{' '}
                    Upper & lower case
                  </li>
                  <li className="flex items-center gap-2">
                    <Check ok={pwCheck.checks.digit} /> At least one number
                  </li>
                  <li className="flex items-center gap-2">
                    <Check ok={pwCheck.checks.symbol} /> At least one symbol
                  </li>
                  <li className="flex items-center gap-2">
                    <Check ok={pwCheck.checks.noNameOrEmail} /> No name/email
                  </li>
                  <li className="flex items-center gap-2">
                    <Check ok={pwCheck.checks.noCommonSeq} /> No common
                    sequences
                  </li>
                </ul>

                {pwCheck.messages.length > 0 && (
                  <div className="mt-2 bg-[#FFF3CD] text-[#5C3C00] px-3 py-2 rounded text-sm">
                    <div className="font-semibold mb-1">
                      Tips to improve your password:
                    </div>
                    <ul className="list-disc pl-5 space-y-1">
                      {pwCheck.messages.map((m, i) => (
                        <li key={i}>{m}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Confirm Password */}
          <div className="flex flex-col gap-2">
            <label
              htmlFor="confirmPassword"
              className="text-[20px] font-medium"
            >
              Confirm Password <span className="text-red-600">*</span>
            </label>
            <div className="relative w-full">
              <input
                id="confirmPassword"
                type={showConfirm ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                onFocus={() => setConfirmTouched(true)}
                className="w-full rounded-md border border-[#6E1B1B] bg-white px-4 py-2.5 text-lg"
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirm((v) => !v)}
                className="underline absolute right-3 top-1/2 -translate-y-1/2 text-[16px] text-[#4A0A0A]"
              >
                {showConfirm ? 'Hide' : 'Show'}
              </button>
            </div>

            {mismatchVisible && (
              <div className="text-red-700 bg-red-100 px-3 py-2 rounded text-sm">
                Passwords do not match.
              </div>
            )}
          </div>

          <div className="flex flex-col items-center pt-4">
            <button
              type="submit"
              disabled={!canSubmit}
              className={`rounded-full text-white text-xl font-semibold px-10 py-3 transition ${
                canSubmit
                  ? 'bg-[#4A0A0A] hover:opacity-95'
                  : 'bg-gray-400 cursor-not-allowed'
              }`}
            >
              Reset Password
            </button>
          </div>
        </form>

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
