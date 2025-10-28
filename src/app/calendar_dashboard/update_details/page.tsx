/**
 * File path: /calendar_dashboard/update_details/page.tsx
 * Front-end Author: Devni Wijesinghe
 * Back-end Author: Denise Alexander
 * Date Created: 22/09/2025
 *
 * Updated by Denise Alexander (7/10/2025): back-end integration
 * added.
 * Updated by Denise Alexander (24/10/2025): Re-desgined the page to include
 * user's name, email, phone number and new password.
 *
 * Last Updated by Denise Alexander (28/10/2025): reverted changes made to fetch profile
 * picture.
 */

'use client';

export const dynamic = 'force-dynamic';

import { User, ArrowLeft } from 'lucide-react';
import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

const colors = {
  pageBg: '#ffd9b3',
  cardBg: '#f6efe2',
  header: '#3A0000',
  text: '#2b2b2b',
  orange: '#F4A261',
};

const isMock = process.env.NEXT_PUBLIC_ENABLE_MOCK === '1';

export default function UpdateDetailsPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [pwd, setPwd] = useState('');
  const [show, setShow] = useState(false);
  // const [profilePic, setProfilePic] = useState<string | null>(null);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [formError, setFormError] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // -------------------------------
  // Load user email (mock or real)
  // -------------------------------
  useEffect(() => {
    async function fetchUser() {
      if (isMock) {
        // Mock mode: load mockEmail from sessionStorage
        const mockEmail = sessionStorage.getItem('mockEmail') || '';
        setEmail(mockEmail);
        return;
      }

      // Real mode: fetch from backend
      try {
        const res = await fetch('/api/v1/user/profile', {
          credentials: 'include',
        });
        if (!res.ok) throw new Error('Failed to load profile');
        const data = await res.json();
        if (data?.fullName) setFullName(data.fullName);
        if (data?.email) setEmail(data.email);
        if (data?.phone) setPhone(data.phone || '');
        // if (data?.profilePic) setProfilePic(data.profilePic);
      } catch (err) {
        console.error('Error fetching user:', err);
      }
    }
    fetchUser();
  }, []);

  // -------------------------------
  // Cancel button handler
  // -------------------------------
  const handleCancel = async () => {
    router.back();
  };

  // -------------------------------
  // Save button handler
  // -------------------------------
  const handleSave = async () => {
    setError('');
    setSuccess(false);

    // Validate email format
    if (!fullName.trim()) {
      setFormError('Full name cannot be empty.');
      return;
    }
    if (email && (!email.includes('@') || !email.includes('.'))) {
      setFormError('Please enter a valid email address.');
      return;
    }

    const body: {
      fullName?: string;
      email?: string;
      phone?: string;
      password?: string;
      profilePic?: string;
    } = {};
    if (fullName) body.fullName = fullName;
    if (email) body.email = email;
    if (phone) body.phone = phone;
    if (pwd) body.password = pwd;
    // if (profilePic) body.profilePic = profilePic;

    if (
      !body.fullName &&
      !body.email &&
      !body.phone &&
      !body.password &&
      !body.profilePic
    ) {
      setFormError('Please update at least one field.');
      return;
    }
    setFormError('');

    // Mock mode: update sessionStorage only
    if (isMock) {
      if (body.email) sessionStorage.setItem('mockEmail', body.email);
      setSuccess(true);
      setPwd('');
      setShow(false);
      setTimeout(() => setSuccess(false), 3000);
      return;
    }

    // Real backend call
    try {
      const res = await fetch('/api/v1/user/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (res.ok) {
        setSuccess(true);
        setPwd('');
        setShow(false);
        setTimeout(() => setSuccess(false), 3000);
      } else {
        setError(data?.error || 'Update failed. Try again later.');
      }
    } catch {
      setError('Update failed. Try again later.');
    }
  };

  /* const handlePicChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadFile(file);

    const reader = new FileReader();
    reader.onloadend = () => {
      setProfilePic(reader.result as string);
    };
    reader.readAsDataURL(file);
  }; */

  // -------------------------------
  // UI
  // -------------------------------
  return (
    <main
      className="min-h-screen w-full flex items-center justify-center px-6 py-12 relative"
      style={{ backgroundColor: colors.pageBg }}
    >
      {/* Top-left logo */}
      <div className="absolute top-6 left-6">
        <Image
          src="/logo-name.png"
          alt="Scheduling of Care"
          width={220}
          height={220}
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
          className="w-full flex items-center justify-between px-6 py-5"
          style={{ backgroundColor: colors.header }}
        >
          <h1 className="text-2xl md:text-3xl font-bold text-white text-center">
            Manage your account
          </h1>
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-lg font-semibold text-[#3A0000] bg-[#EAD8C8] hover:bg-[#DFC8B4] border border-[#D4B8A0] rounded-md px-4 py-2 transition"
          >
            <ArrowLeft size={22} strokeWidth={2.5} />
            Back
          </button>
        </div>

        <div className="px-8 md:px-10 py-8 md:py-10 text-black flex flex-col gap-8">
          {/* Validation error */}
          {formError && (
            <div className="mb-4 p-2 rounded-md bg-red-100 border border-red-400 text-red-700">
              {formError}
            </div>
          )}

          {/* Profile Pic */}
          <section className="flex flex-col items-center text-center">
            <div className="relative w-32 h-32 mb-4">
              <div className="w-full h-full flex items-center justify-center rounded-full border-2 border-[#3A0000]/40 bg-white">
                <User
                  className="text-[#3A0000]"
                  size={70}
                  strokeWidth={0.3}
                  fill={colors.header}
                  color={colors.header}
                />
              </div>
            </div>

            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2 rounded-md bg-[#3A0000] text-white hover:bg-[#502121] transition"
            >
              Upload photo
            </button>

            <button
              // onClick={() => setProfilePic(null)}
              className="mt-2 text-sm text-red-600 hover:underline"
            >
              Remove photo
            </button>

            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              // onChange={handlePicChange}
              className="hidden"
            />
          </section>

          {/* Full Name */}
          <div>
            <label
              className="block text-lg font-semibold mb-2"
              style={{ color: colors.text }}
            >
              Full Name
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full bg-white border-2 rounded-md px-4 py-3 focus:outline-none focus:ring-2"
              style={{ borderColor: `${colors.header}55` }}
            />
          </div>

          {/* Email input */}
          <div>
            <label
              className="block text-lg font-semibold mb-2"
              style={{ color: colors.text }}
            >
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-white border-2 rounded-md px-4 py-3 focus:outline-none focus:ring-2"
              style={{ borderColor: `${colors.header}55` }}
            />
          </div>

          {/* Phone */}
          <div>
            <label
              className="block text-lg font-semibold mb-2"
              style={{ color: colors.text }}
            >
              Phone Number
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full bg-white border-2 rounded-md px-4 py-3 focus:outline-none focus:ring-2"
              style={{ borderColor: `${colors.header}55` }}
            />
          </div>

          {/* Password input */}
          <div>
            <label
              className="block text-lg font-semibold mb-2"
              style={{ color: colors.text }}
            >
              New Password
            </label>
            <input
              type={show ? 'text' : 'password'}
              value={pwd}
              onChange={(e) => setPwd(e.target.value)}
              className="w-full bg-white border-2 rounded-md px-4 py-3 focus:outline-none focus:ring-2"
              style={{ borderColor: `${colors.header}55` }}
              placeholder="Enter new password"
            />
            <label
              className="mt-3 flex items-center gap-2 text-md"
              style={{ color: colors.text }}
            >
              <input
                type="checkbox"
                checked={show}
                onChange={(e) => setShow(e.target.checked)}
              />
              Show password
            </label>
          </div>

          {/* Backend error */}
          {error && (
            <div className="text-red-700 bg-red-100 px-4 py-2 rounded">
              {error}
            </div>
          )}

          {/* Success message */}
          {success && (
            <div className="text-green-700 bg-green-100 px-4 py-2 rounded m-4">
              Your details have been successfully updated!
            </div>
          )}

          {/* Action buttons */}
          <div className="mt-10 flex items-center justify-end gap-6">
            <button
              type="button"
              onClick={handleCancel}
              className="px-5 py-2.5 rounded-md text-lg font-medium text-[#3A0000] bg-[#F3E9DF] border border-[#D8C6B9] hover:bg-[#E9DED2] transition"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2.5 rounded-md text-lg font-medium text-white bg-[#3A0000] hover:bg-[#502121] transition"
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
