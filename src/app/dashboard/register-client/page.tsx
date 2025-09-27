"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

type Client = {
  id: string;
  fullName: string;
  accessCode: string;
};

const colors = {
  pageBg: "#ffd9b3", // page background
  cardBg: "#F7ECD9", // card background
  header: "#3A0000", // maroon header
  text: "#2b2b2b",
  accent: "#F39C6B",
};

export default function RegisterClientPage() {
  const [fullName, setFullName] = useState("");
  const [accessCode, setAccessCode] = useState("");
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const stored: Client[] = JSON.parse(
      localStorage.getItem("clients") || "[]"
    );
    const newClient: Client = {
      id: Date.now().toString(),
      fullName,
      accessCode,
    };

    localStorage.setItem("clients", JSON.stringify([...stored, newClient]));

    setFullName("");
    setAccessCode("");

    router.push("/dashboard");
  };

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

      {/* Centered card */}
      <div
        className="w-full max-w-lg rounded-2xl shadow-lg overflow-hidden border"
        style={{ backgroundColor: colors.cardBg, borderColor: "#e7d8c4" }}
      >
        {/* Maroon header with centered title */}
        <div
          className="w-full flex items-center justify-center px-6 py-5"
          style={{ backgroundColor: colors.header }}
        >
          <h1 className="text-2xl md:text-3xl font-bold text-white text-center">
            Register Client with Access Code
          </h1>
        </div>

        <form
          onSubmit={handleSubmit}
          className="px-6 md:px-8 py-6 md:py-8 text-black space-y-6"
        >
          {/* Full name */}
          <div>
            <label
              className="block text-lg mb-2"
              style={{ color: colors.text }}
            >
              Client Full Name
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              className="w-full bg-white border-2 rounded-md px-4 py-3 focus:outline-none focus:ring-2"
              style={{ borderColor: `${colors.header}55` }}
              placeholder="e.g., John Smith"
            />
          </div>

          {/* Access code */}
          <div>
            <label
              className="block text-lg mb-2"
              style={{ color: colors.text }}
            >
              Client Access Code
            </label>
            <input
              type="text"
              value={accessCode}
              onChange={(e) => setAccessCode(e.target.value)}
              required
              className="w-full bg-white border-2 rounded-md px-4 py-3 focus:outline-none focus:ring-2"
              style={{ borderColor: `${colors.header}55` }}
              placeholder="Enter access code"
            />
          </div>

          {/* Actions */}
          <div className="mt-2 flex items-center justify-end gap-6">
            <button
              type="button"
              onClick={() => router.push("/dashboard")}
              className="px-6 py-2.5 rounded-full border text-gray-700 hover:bg-gray-200"
            >
              Cancel
            </button>

            <button
              type="submit"
              className="px-7 py-2.5 rounded-full font-semibold border"
              style={{
                backgroundColor: colors.accent,
                borderColor: "#e48c58",
                color: "black",
              }}
            >
              Register
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
