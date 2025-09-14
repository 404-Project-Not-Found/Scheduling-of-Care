// src/app/page.tsx
"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

export default function Home() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [staySigned, setStaySigned] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPwd, setShowPwd] = useState(false); // NEW

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    // always show error message （no actual authentication logic implemented yet）
    setError("Incorrect email address or password, please try again.");
  }

  return (
    <div className="h-screen w-full bg-[#F3E9D9] text-zinc-900">
      <div className="grid grid-cols-1 lg:grid-cols-2 h-full w-full">
        {/* Left section */}
        <section className="bg-[#F3C8A5] relative flex flex-col h-full">
          <div className="flex flex-col items-start h-full pl-0 lg:pl-18 pr-8 lg:pr-10 justify-start mt-33">
            <Image
              src="/logo-name.png"
              alt="App Logo"
              width={500}
              height={100}
              priority
              className="mb-10 -ml-16 lg:-ml-12"
            />
            <h1 className="text-6xl font-extrabold tracking-tight mb-5">Welcome!</h1>
            <p className="max-w-[42rem] text-[19px] leading-6">
              Our platform helps streamline care management by connecting parents/power of attorney,
              carers, clients, and management in one place. Easily schedule, manage, and track care
              activities with clarity and confidence.
            </p>
          </div>
        </section>

        {/* Right: login form */}
        <section className="bg-[#F7ECD9] p-12 flex items-center justify-center">
          <div className="w-full max-w-md">
            <h2 className="text-4xl font-extrabold tracking-tight mb-10 text-center">
              User Login
            </h2>

            <form className="space-y-6" onSubmit={handleSubmit} noValidate>
              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-xl font-medium mb-2 text-left">
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-md border border-[#4A0A0A] bg-white shadow-sm px-3 py-3 text-lg outline-none focus:ring-2 focus:ring-[#4A0A0A]/40"
                />
              </div>

              {/* Password with Show/Hide */}
              <div>
                <label htmlFor="password" className="block text-xl font-medium mb-2 text-left">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={showPwd ? "text" : "password"}   
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-md border border-[#4A0A0A] bg-white shadow-sm px-3 py-3 text-lg 
                                outline-none focus:ring-2 focus:ring-[#4A0A0A]/40 pr-20"
                />
                <button
                    type="button"
                    aria-label={showPwd ? "Hide password" : "Show password"}
                    aria-pressed={showPwd}
                    onClick={() => setShowPwd((s) => !s)}
                    className="absolute inset-y-0 right-3 my-auto text-sm font-medium text-[#4A0A0A]
                                underline underline-offset-2 hover:opacity-80 focus:outline-none"
                >
                    {showPwd ? "Hide" : "Show"}
                  </button>
                </div>
              </div>

              {/* Stay signed in */}
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="staySignedIn"
                  checked={staySigned}
                  onChange={(e) => setStaySigned(e.target.checked)}
                  className="h-5 w-5 rounded border border-black/40 accent-[#4A0A0A]"
                />
                <label htmlFor="staySignedIn" className="text-lg">
                  Stay signed in for 30 days
                </label>
              </div>

              {/* Error message */}
              {error && (
                <div
                  role="alert"
                  aria-live="assertive"
                  className="rounded-md border border-rose-300 bg-rose-100/80 px-4 py-3 text-[#1c130f]"
                >
                  {error}
                </div>
              )}

              {/* Login button */}
              <button
                type="submit"
                className="w-full rounded-full px-8 py-4 text-xl font-semibold bg-[#4A0A0A] text-white hover:opacity-95 transition"
              >
                Login
              </button>
            </form>

            {/* Links */}
            <div className="mt-6 text-center">
              <Link href="/forgot-password" className="text-lg underline underline-offset-4 hover:opacity-80">
                Forgot Password?
              </Link>
            </div>
            <p className="mt-4 text-lg text-center">
              Don’t have an account?{" "}
              <Link href="/signup" className="underline underline-offset-4 font-semibold hover:opacity-80">
                Sign Up
              </Link>
            </p>
          </div>
        </section>
      </div>

      {/* Floating help button */}
      <Link
        href="/help"
        aria-label="Help"
        className="fixed bottom-6 right-6 flex h-12 w-12 items-center justify-center rounded-full
                   bg-[#E37E72] text-white text-2xl font-bold shadow-lg hover:shadow-xl transition"
      >
        ?
      </Link>
    </div>
  );
}
    