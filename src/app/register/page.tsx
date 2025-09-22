"use client";
import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";

export default function Page() {
  const [fullName, setFullName] = useState("");
  const [accessCode, setAccessCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage(null);

    if (!fullName.trim() || !accessCode.trim()) {
      setMessage("Please fill out both fields.");
      return;
    }

    try {
      setLoading(true);
      await new Promise((r) => setTimeout(r, 700));
      setMessage("Client registered successfully (demo).");
      setFullName("");
      setAccessCode("");
    } catch (err) {
      setMessage("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen w-full flex flex-col bg-[#F3E9D9]">
      {/* Header with logo */}
      <header className="w-full px-6 py-5 flex items-center">
        <Image
          src="/logo-name.png" 
          alt="Scheduling of Care"
          width={200}
          height={50}
          priority
        />
      </header>

      {/* Banner */}
      <div className="w-full bg-[#3A0000] text-white">
        <div className="px-6 py-6">
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-wide text-center">
            Register Client with Access Code
          </h1>
        </div>
      </div>

      {/* Form */}
        <section className="flex-1 w-full flex items-center justify-center px-6 -mt-15">
            <form onSubmit={onSubmit} className="w-full max-w-2xl space-y-9">
                {/* Full name */}
                <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-6 mb-15">
                <label
                    htmlFor="fullName"
                    className="md:w-1/3 text-lg md:text-xl font-medium text-zinc-900 flex items-center gap-2"
                >
                    <span>Client Full Name</span>
                    <InfoDot title="Enter the client's legal full name." />
                </label>
                <input
                    id="fullName"
                    name="fullName"
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="md:flex-1 w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 text-lg shadow-sm focus:outline-none focus:ring-4 focus:ring-zinc-300/50"
                />
                </div>

                {/* Access code */}
                <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-6 mb-20">
                <label
                    htmlFor="accessCode"
                    className="md:w-1/3 text-lg md:text-xl font-medium text-zinc-900 flex items-center gap-2"
                >
                    <span>Client Access Code</span>
                    <InfoDot title="Provided by the system or admin for client linking." />
                </label>
                <input
                    id="accessCode"
                    name="accessCode"
                    type="text"
                    value={accessCode}
                    onChange={(e) => setAccessCode(e.target.value)}
                    className="md:flex-1 w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 text-lg shadow-sm tracking-wide focus:outline-none focus:ring-4 focus:ring-zinc-300/50"
                />
                </div>

                {/* Button */}
                <div className="mt-3 flex items-center justify-center">
                <button
                    type="submit"
                    disabled={loading}
                    className="rounded-full px-10 py-3 text-xl font-semibold text-white shadow-md transition active:scale-95 disabled:opacity-60 bg-[#3A0000]"
                >
                    {loading ? "Registering…" : "Register"}
                </button>
                </div>

                {message && (
                <p className="mt-6 text-center text-base text-zinc-700">{message}</p>
                )}
            </form>
        </section>

      <HelpButton />
    </main>
  );
}

function InfoDot({ title }: { title?: string }) {
  return (
    <span
      title={title}
      aria-label={title}
      className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-rose-300 text-white text-[12px] leading-none select-none"
    >
      i
    </span>
  );
}

function HelpButton() {
  return (
    <Link
      href="/"
      aria-label="Back to Home"
      className="fixed bottom-6 right-6 flex h-12 w-12 items-center justify-center rounded-full bg-rose-300 text-white text-2xl shadow-lg"
      title="Back to Home"
    >
      ←
    </Link>
  );
}
