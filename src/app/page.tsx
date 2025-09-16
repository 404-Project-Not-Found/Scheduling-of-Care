// src/app/page.tsx
"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

export default function Home() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [staySigned, setStaySigned] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    setError(null);

    // If required fields are empty, trigger native validation tooltip.
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    try{
      // Send POST request to login API route
      const res = await fetch("/api/login", {
        method: "POST", 
        headers: {"Content-Type": "application/json"}, 
        body: JSON.stringify({email, password}) // Send login credentials
      });

      const data = await res.json();

      // Login failed
      if(!res.ok){
        throw new Error(data.error || "Login failed");
      }

      console.log("logged in user:", data.user);

      // Redirect user based on role
      switch (data.user.role) {
        case "carer":
          window.location.href = "/dashboard/carer";
          break;
        case "management":
          window.location.href = "/dashboard/management";
          break;
        case "family":
          window.location.href = "/dashboard/family";
        default:
          window.location.href = "/dashboard";
      }
    }
    catch(err: unknown) {
      if(err instanceof Error){
        setError(err.message);
      }
      else{
        setError("An unexepected error occurred")
      }
    }

    // Fake auth: always show error for now (no backend yet).
    // setError("Incorrect email address or password, please try again.");
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
            <h1 className="text-6xl font-extrabold tracking-tight mb-5">
              Welcome!
            </h1>
            <p className="max-w-[42rem] text-[19px] leading-6">
              Our platform helps streamline care management by connecting
              parents/power of attorney, carers, clients, and management in one
              place. Easily schedule, manage, and track care activities with
              clarity and confidence.
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
                <label
                  htmlFor="email"
                  className="block text-xl font-medium mb-2 text-left"
                >
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (error) setError(null);
                  }}
                  className="w-full rounded-md border border-[#4A0A0A] bg-white shadow-sm px-3 py-3 text-lg outline-none focus:ring-2 focus:ring-[#4A0A0A]/40"
                />
              </div>

              {/* Password + Show/Hide link */}
              <div>
                <label
                  htmlFor="password"
                  className="block text-xl font-medium mb-2 text-left"
                >
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={showPw ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (error) setError(null);
                    }}
                    className="w-full rounded-md border border-[#4A0A0A] bg-white shadow-sm px-3 py-3 text-lg outline-none focus:ring-2 focus:ring-[#4A0A0A]/40"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw((s) => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#4A0A0A] underline underline-offset-4 text-sm"
                  >
                    {showPw ? "Hide" : "Show"}
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
                  className="rounded-md bg-rose-100 text-[#7a0a0a] border border-rose-300 px-4 py-3 text-sm"
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
              <Link
                href="/forgot-password"
                className="text-lg underline underline-offset-4 hover:opacity-80"
              >
                Forgot Password?
              </Link>
            </div>
            <p className="mt-4 text-lg text-center">
              Don’t have an account?{" "}
              <Link
                href="/signup"
                className="underline underline-offset-4 font-semibold hover:opacity-80"
              >
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
