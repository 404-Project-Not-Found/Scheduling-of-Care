"use client";

export const dynamic = "force-dynamic";

import React, { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";

const colors = {
  pageBg: "#ffd9b3",
  cardBg: "#F7ECD9",
  header: "#3A0000",
  text: "#2b2b2b",
  orange: "#F4A261",
};

export default function UpdateDetailsPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [pwd, setPwd] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");

  function handleSave() {
    if (!email.trim() || !pwd.trim()) {
      setError("Email and password cannot be empty.");
      return;
    }

    router.push("/menu");
  }

  function handleCancel() {
    router.push("/dashboard");
  }

  return (
    <main
      className="min-h-screen w-full flex items-center justify-center px-6 py-12 relative"
      style={{ backgroundColor: colors.pageBg }}
    >
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

      {/* Centered card */}
      <div
        className="w-full max-w-xl md:max-w-2xl rounded-2xl shadow-lg overflow-hidden"
        style={{ backgroundColor: colors.cardBg }}
      >
        {/* Maroon header with centered title */}
        <div
          className="w-full flex items-center justify-center px-6 py-5"
          style={{ backgroundColor: colors.header }}
        >
          <h1 className="text-2xl md:text-3xl font-bold text-white text-center">
            Update your details
          </h1>
        </div>

        {/* Content */}
        <div className="px-8 md:px-10 py-8 md:py-10 text-black">
          {/* Email */}
          <label className="block text-lg mb-2" style={{ color: colors.text }}>
            Change email:
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setError("");
            }}
            className="w-full bg-white border-2 rounded-md px-4 py-3 mb-8 focus:outline-none focus:ring-2"
            style={{ borderColor: `${colors.header}55` }}
            placeholder="Enter new email"
          />

          {/* Password */}
          <label className="block text-lg mb-2" style={{ color: colors.text }}>
            Change password:
          </label>
          <input
            type={show ? "text" : "password"}
            value={pwd}
            onChange={(e) => {
              setPwd(e.target.value);
              setError("");
            }}
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

          {error && (
            <p className="mt-4 text-sm" style={{ color: "#b91c1c" }}>
              {error}
            </p>
          )}

          {/* Actions */}
          <div className="mt-10 flex items-center justify-end gap-6">
            <button
              type="button"
              className="px-6 py-2.5 rounded-full border text-gray-700 hover:bg-gray-200"
              onClick={handleCancel}
            >
              Cancel
            </button>

            <button
              type="button"
              className="px-7 py-2.5 rounded-full font-semibold border"
              style={{
                backgroundColor: colors.orange,
                borderColor: "#f08a00",
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
    </main>
  );
}
