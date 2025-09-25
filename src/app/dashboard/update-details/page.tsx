'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect, Suspense } from 'react';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';

const colors = {
  pageBg: '#ffd9b3',
  cardBg: '#F7ECD9',
  header: '#3A0000',
  text: '#2b2b2b',
  orange: '#F4A261',
};

type Role = 'family' | 'carer' | 'management';

/** 仅负责在 Suspense 内读取 search params & sessionStorage，并回写 backHref */
function BackHrefResolver({
  setBackHref,
}: {
  setBackHref: (v: string) => void;
}) {
  const search = useSearchParams();

  useEffect(() => {
    const fromQuery = search.get('from') as Role | null;
    const stored =
      typeof window !== 'undefined'
        ? (sessionStorage.getItem('mockRole') as Role | null)
        : null;

    const role: Role | null = fromQuery ?? stored;
    const href =
      role === 'carer'
        ? '/carer_dashboard'
        : role === 'management'
          ? '/menu/management'
          : '/menu/family';

    setBackHref(href);
  }, [search, setBackHref]);

  return null;
}

export default function UpdateDetailsPage() {
  const router = useRouter();

  // 用 state 存 backHref，初始给一个安全默认值
  const [backHref, setBackHref] = useState('/menu/family');

  const [email, setEmail] = useState('');
  const [pwd, setPwd] = useState('');
  const [show, setShow] = useState(false);

  // States for backend update
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [formError, setFormError] = useState<string>('');

  // State for help tooltip visibility
  const [showHelp, setShowHelp] = useState(false);
  const instructions = [
    "Change your email using the 'Change email' field.",
    "Change your password using the 'Change password' field.",
    "Use the 'Show password' checkbox to view your password.",
    "Click 'Cancel' to go back without saving.",
    "Click 'Save' to update your details.",
  ];

  // Fetch user profile (email, optionally role) from backend
  useEffect(() => {
    async function fetchUser() {
      try {
        const res = await fetch('/api/user/profile');
        if (!res.ok) throw new Error('Failed to load profile');
        const data = await res.json();
        if (data.email) setEmail(data.email);

        // Optional: store role as a fallback if backend returns it
        if (
          data.role &&
          (['family', 'carer', 'management'] as Role[]).includes(data.role)
        ) {
          sessionStorage.setItem('mockRole', data.role);
        }
      } catch (err) {
        console.error('Error fetching user:', err);
      }
    }
    fetchUser();
  }, []);

  // Validate input and call backend API to update profile
  const handleSave = async () => {
    setError('');
    setSuccess(false);

    if (email && (!email.includes('@') || !email.includes('.'))) {
      setFormError('Please enter a valid email address.');
      return;
    }

    const body: { email?: string; password?: string } = {};
    if (email) body.email = email;
    if (pwd) body.password = pwd;

    if (!body.email && !body.password) {
      setFormError('Please enter an email or password to update.');
      return;
    }

    setFormError('');

    try {
      const res = await fetch('/api/user/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (res.ok) {
        setSuccess(true);
        setPwd('');
        setShow(false);
        // After success, navigate back to the correct dashboard
        setTimeout(() => {
          router.push(backHref);
        }, 800);
      } else {
        setError(data.error || 'Update failed. Try again later.');
      }
    } catch {
      setError('Network error. Please try again.');
    }
  };

  return (
    <main
      className="min-h-screen w-full flex items-center justify-center px-6 py-12 relative"
      style={{ backgroundColor: colors.pageBg }}
    >
      {/* 只有这个子组件会读 useSearchParams；被 Suspense 包裹，就不会触发 CSR bailout */}
      <Suspense fallback={null}>
        <BackHrefResolver setBackHref={setBackHref} />
      </Suspense>

      {/* Top-left logo */}
      <div className="absolute top-6 left-6">
        <Image
          src="/logo-name.png"
          alt="Scheduling of Care"
          width={220}
          height={80}
          className="object-contain"
          priority
        />
      </div>

      {/* Card container */}
      <div
        className="w-full max-w-xl md:max-w-2xl rounded-2xl shadow-lg overflow-hidden"
        style={{ backgroundColor: colors.cardBg }}
      >
        {/* Header */}
        <div
          className="w-full flex items-center justify-center px-6 py-5"
          style={{ backgroundColor: colors.header }}
        >
          <h1 className="text-2xl md:text-3xl font-bold text-white text-center">
            Update your details
          </h1>
        </div>

        {/* Success message */}
        {success && (
          <div className="text-green-700 bg-green-100 px-4 py-2 rounded m-4">
            Your details have been successfully updated!
          </div>
        )}

        {/* Content area */}
        <div className="px-8 md:px-10 py-8 md:py-10 text-black">
          {/* Form validation error */}
          {formError && (
            <div className="mb-4 p-2 rounded-md bg-red-100 border border-red-400 text-red-700">
              {formError}
            </div>
          )}

          {/* Email input */}
          <label className="block text-lg mb-2" style={{ color: colors.text }}>
            Change email:
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-white border-2 rounded-md px-4 py-3 mb-8 focus:outline-none focus:ring-2"
            style={{ borderColor: `${colors.header}55` }}
            placeholder="Enter new email"
          />

          {/* API error */}
          {error && (
            <div className="text-red-700 bg-red-100 px-4 py-2 rounded mb-4">
              {error}
            </div>
          )}

          {/* Password input */}
          <label className="block text-lg mb-2" style={{ color: colors.text }}>
            Change password:
          </label>
          <input
            type={show ? 'text' : 'password'}
            value={pwd}
            onChange={(e) => setPwd(e.target.value)}
            className="w-full bg-white border-2 rounded-md px-4 py-3 focus:outline-none focus:ring-2"
            style={{ borderColor: `${colors.header}55` }}
            placeholder="Enter new password"
          />

          {/* Show password toggle */}
          <label
            className="mt-4 flex items-center gap-2 text-lg"
            style={{ color: colors.text }}
          >
            <input
              type="checkbox"
              checked={show}
              onChange={(e) => setShow(e.target.checked)}
              className="h-4 w-4"
            />
            Show password
          </label>

          {/* Action buttons */}
          <div className="mt-10 flex items-center justify-end gap-6">
            <button
              type="button"
              className="px-6 py-2.5 rounded-full border text-gray-700 hover:bg-gray-200"
              onClick={() => router.push(backHref)} // Cancel → return by role
            >
              Cancel
            </button>

            <button
              type="button"
              className="px-7 py-2.5 rounded-full font-semibold border"
              style={{
                backgroundColor: colors.orange,
                borderColor: '#f08a00',
                color: colors.header,
              }}
              onClick={handleSave}
            >
              Save
            </button>
          </div>
        </div>

        <div className="h-4" />
      </div>

      {/* Help tooltip */}
      <div
        className="fixed bottom-8 right-8 z-50"
        onMouseEnter={() => setShowHelp(true)}
        onMouseLeave={() => setShowHelp(false)}
      >
        <div className="relative group">
          <button
            className="w-10 h-10 rounded-full text-white font-bold text-lg"
            style={{ backgroundColor: '#ed5f4f' }}
          >
            ?
          </button>

          {showHelp && (
            <div className="absolute bottom-14 right-0 w-80 p-4 bg-white border border-gray-400 rounded shadow-lg text-black text-sm">
              <h3 className="font-bold mb-2">Update Details Help</h3>
              <ul className="list-disc list-inside space-y-1">
                {instructions.map((instr, idx) => (
                  <li key={idx}>{instr}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
