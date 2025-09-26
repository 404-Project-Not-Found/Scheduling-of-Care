/**
 * Filename: /management_dashboard/register_client/page.tsx
 * Authors: Vanessa Teo & Denise Alexander
 * Date Created: 22/09/2025
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function RegisterClientPage() {
  const [accessCode, setAccessCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);

  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      const code = accessCode.trim();
      if (!code) {
        setError('Access code cannot be empty.');
        setLoading(false);
        return;
      }

      // Call the api endpoint to register the client
      const res = await fetch('/api/management/register_client', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accessCode }),
      });

      const data = await res.json();

      // If api returns an error
      if (!res.ok) {
        throw new Error(data.error || 'Failed to register client.');
      }

      // Client was successfully registered
      setSuccess(data.message);
      setAccessCode('');
    } catch (err) {
      // Handles errors
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Something went wrong.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="bg-[#fff4e6] rounded-2xl shadow-md w-full max-w-lg border border-[#3d0000]/20">
        {/* Maroon header */}
        <h1 className="text-xl font-semibold px-6 py-4 bg-[#3d0000] text-white rounded-t-2xl">
          Register Client with Access Code
        </h1>

        <form onSubmit={handleSubmit} className="p-6 space-y-5 text-black">
          {/* Error message */}
          {error && (
            <div
              role="alert"
              className="mb-4 px-4 py-3 rounded-md text-sm bg-rose-100 border border-rose-300 text-rose-700"
            >
              {error}
            </div>
          )}
          {success && (
            <div
              role="status"
              className="mb-4 px-4 py-3 rounded-md text-sm bg-green-100 border border-green-300 text-green-700"
            >
              {success}
            </div>
          )}
          <div>
            <label className="block mb-1 font-medium">Client Access Code</label>
            <input
              type="text"
              value={accessCode}
              onChange={(e) => setAccessCode(e.target.value)}
              required
              className="w-full px-3 py-2 border rounded-md"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => router.push('/management_dashboard/clients_list')}
              className="px-4 py-2 rounded-md border hover:bg-gray-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-md bg-[#e07a5f] text-white font-semibold hover:bg-[#d06950]"
            >
              Register
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
