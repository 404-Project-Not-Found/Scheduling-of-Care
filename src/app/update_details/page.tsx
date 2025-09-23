"use client";

import React, { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";

const colors = {
  pageBg: "#ffd9b3",
  cardBg: "#F7ECD9",
  header: "#4A0A0A",
  text: "#2b2b2b",
  orange: "#ff9900",
};

export default function UpdateDetailsPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [pwd, setPwd] = useState("");
  const [show, setShow] = useState(false);
  const [showHelp, setShowHelp] = useState(false); // tooltip visibility

  const instructions = [
    "Change your email using the 'Change email' field.",
    "Change your password using the 'Change password' field.",
    "Use the 'Show password' checkbox to view your password.",
    "Click 'Cancel' to go back to the dashboard without saving.",
    "Click 'Save' to update your details and return to the dashboard.",
  ];

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
        {/* Top bar */}
        <div
          className="w-full flex items-center justify-center px-6 py-5"
          style={{ backgroundColor: colors.header }}
        >
          <h1 className="text-2xl md:text-3xl font-bold text-white text-center">
            Update your details
          </h1>
        </div>

        {/* Content area */}
        <div className="px-8 md:px-10 py-8 md:py-10 text-black">
          {/* Email */}
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

          {/* Password */}
          <label className="block text-lg mb-2" style={{ color: colors.text }}>
            Change password:
          </label>
          <input
            type={show ? "text" : "password"}
            value={pwd}
            onChange={(e) => setPwd(e.target.value)}
            className="w-full bg-white border-2 rounded-md px-4 py-3 focus:outline-none focus:ring-2"
            style={{ borderColor: `${colors.header}55` }}
            placeholder="Enter new password"
          />

          {/* Show password toggle */}
          <label className="mt-4 flex items-center gap-2 text-lg" style={{ color: colors.text }}>
            <input
              type="checkbox"
              checked={show}
              onChange={(e) => setShow(e.target.checked)}
              className="h-4 w-4"
            />
            Show password
          </label>

          {/* Actions */}
          <div className="mt-10 flex items-center justify-end gap-6">
            <button
              type="button"
              className="px-6 py-2.5 rounded-full border text-gray-700 hover:bg-gray-200"
              onClick={() => router.push("/dashboard")}
            >
              Cancel
            </button>

            <button
              type="button"
              className="px-7 py-2.5 rounded-full font-semibold border"
              style={{ backgroundColor: colors.orange, borderColor: "#f08a00", color: colors.header }}
              onClick={() => router.push("/dashboard")}
            >
              Save
            </button>
          </div>
        </div>

        <div className="h-4" />
      </div>

      {/* Help Button */}
      <div
        className="fixed bottom-8 right-8 z-50"
        onMouseEnter={() => setShowHelp(true)}
        onMouseLeave={() => setShowHelp(false)}
      >
        <div className="relative group">
          <button
            className="w-10 h-10 rounded-full text-white font-bold text-lg"
            style={{ backgroundColor: "#ed5f4f" }}
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
