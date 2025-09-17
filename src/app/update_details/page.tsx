'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function UpdateDetailsPage() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState(''); // New state for error
  const [showHelp, setShowHelp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSave = async () => {
    if (!email.trim() || !password.trim()) {
      setError('Email and password cannot be empty.');
      setSaved(false);
      return;
    }

    try {
      setError('');
      setSaved(true);

      // TODO: call your API here if needed
      // await fetch('/api/update-details', { method: 'POST', body: JSON.stringify({ email, password }) });

      // Go back; fallback to /menu if no history
      router.back();
      setTimeout(() => router.push('/menu'), 0);
    } catch (e) {
      console.error(e);
      setError('Failed to save. Please try again.');
      setSaved(false);
    }
  };

  const handleCancel = () => {
    router.back();
    setTimeout(() => router.push('/menu'), 0);
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ backgroundColor: '#ffd9b3' }}
    >
      <div
        className="rounded-md shadow-md p-8 w-[500px]"
        style={{ backgroundColor: '#fff4e6', color: '#000' }}
      >
        <h2 className="text-xl font-bold mb-6">Update your details</h2>

        <div className="mb-5">
          <label className="block text-sm font-medium mb-1">Change email:</label>
          <input
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setSaved(false);
              setError('');
            }}
            className="w-full border rounded px-3 py-2 text-black"
          />
        </div>

        <div className="mb-2">
          <label className="block text-sm font-medium mb-1">Change password:</label>
          <input
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setSaved(false);
              setError('');
            }}
            className="w-full border rounded px-3 py-2 text-black"
          />
        </div>

        {/* Show password checkbox */}
        <div className="mb-5">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={showPassword}
              onChange={(e) => setShowPassword(e.target.checked)}
            />
            Show password
          </label>
        </div>

        {/* Error or success message */}
        {error && <div className="text-red-600 text-sm mb-5">{error}</div>}
        {saved && !error && (
          <div className="text-green-600 text-sm mb-5">
            Details saved! (Email: {email || 'not set'}, Password:{' '}
            {password ? '******' : 'not set'})
          </div>
        )}

        <div className="flex items-center justify-between mt-6">
          {/* Help button */}
          <div
            className="relative"
            onMouseEnter={() => setShowHelp(true)}
            onMouseLeave={() => setShowHelp(false)}
          >
            <button className="w-7 h-7 rounded-full bg-red-400 text-white text-sm font-bold flex items-center justify-center">
              ?
            </button>
            {showHelp && (
              <div className="absolute left-9 top-0 bg-white border text-sm p-3 rounded shadow-md w-60 text-black">
                Enter your new email and/or password, then click <b>Save</b>.
                Use <b>Cancel</b> to discard changes.
              </div>
            )}
          </div>

          <div className="flex gap-4">
            <button
              onClick={handleCancel}
              className="text-gray-700 hover:underline"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="bg-orange-400 text-white px-5 py-2 rounded shadow hover:bg-orange-500"
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
