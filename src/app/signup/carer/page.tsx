"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

export default function CarerSignupPage() {
  const [showPw, setShowPw] = useState(false);
  const [error, setError] =useState<string | null>(null);
  const [userExists, setUserExists] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setUserExists(false);

    const form = e.currentTarget;
    const fullName = (form.userName as HTMLInputElement).value;
    const email = (form.email as HTMLInputElement).value;
    const password = (form.password as HTMLInputElement).value;
    const confirm = (form.confirm as HTMLInputElement).value;

    try{
      // Call signup API route
      const res = await fetch("/api/signup", {
        method: "POST", 
        headers: { "Content-Type": "application/json"}, 
        body: JSON.stringify({fullName, email, password, confirm, role: "carer"})
      });

      const data = await res.json();

      // Handle errors from server
      if(!res.ok){
        if(res.status === 409){
          // User already exists
          setUserExists(true);
          return;
        }
        throw new Error(data.error || "Sign up failed")
      }

      // Sign up is successful, redirect to home after short delay
      setSuccess(true);
      setTimeout(() => {
        window.location.href = "/";
      }, 3000);
    }
    catch(err: unknown){
      if(err instanceof Error){
        if(err.message.includes("exists")){
          setUserExists(true);
        }
        else{
          setError(err.message);
        }
      }
      else{
        setError("An unexpected error has occurred")
      }
    }
  }

  return (
    <div className="min-h-screen w-full bg-[#F3E9D9] flex flex-col items-center justify-center px-4">
      {/* Top-left logo */}
      <div className="absolute left-8 top-8">
        <Image
          src="/logo-name.png"
          alt="Scheduling of Care"
          width={210}
          height={64}
          priority
        />
      </div>

      {/* Title - make sure it's centered */}
      <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-black mb-12 text-center w-full">
        Carer Sign Up
      </h1>

      {/* Vertical form layout */}
      <form onSubmit = {handleSubmit} className="w-full max-w-lg space-y-8 text-black">

        {/* User Name */}
        <div className="flex flex-col gap-2">
            <label
                htmlFor="userName"
                className="text-[20px] font-medium flex items-center gap-2"
            >
                <span>Enter Full Name</span>
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-[#E37E72] text-white text-sm font-bold">
                i
                </span>
            </label>
            <input
                id="userName"
                type="text"
                className="w-full rounded-md border border-[#6E1B1B] bg-white text-black px-4 py-2.5 text-lg outline-none focus:ring-2 focus:ring-[#4A0A0A]/30"
                required
            />
        </div>

        {/* Email */}
        <div className="flex flex-col gap-2">
          <label
            htmlFor="email"
            className="text-[20px] font-medium flex items-center gap-2"
          >
            <span>Enter Email</span>
            <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-[#E37E72] text-white text-sm font-bold">
              i
            </span>
          </label>
          <input
            id="email"
            type="email"
            className="w-full rounded-md border border-[#6E1B1B] bg-white text-black px-4 py-2.5 text-lg outline-none focus:ring-2 focus:ring-[#4A0A0A]/30"
            required
          />
        </div>

        {/* Password */}
        <div className="flex flex-col gap-2 relative">
          <label
            htmlFor="password"
            className="text-[20px] font-medium flex items-center gap-2"
          >
            <span>Create Password</span>
            <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-[#E37E72] text-white text-sm font-bold">
              i
            </span>
          </label>
          <div className="relative w-full">
            <input
              id="password"
              type={showPw ? "text" : "password"}
              className="w-full rounded-md border border-[#6E1B1B] bg-white text-black px-4 py-2.5 text-lg outline-none focus:ring-2 focus:ring-[#4A0A0A]/30"
              required
            />
            <button
              type="button"
              onClick={() => setShowPw((v) => !v)}
              className="absolute top-1/2 -translate-y-1/2 right-[-8rem] text-[16px] underline underline-offset-4 text-[#4A0A0A] hover:opacity-80 whitespace-nowrap"
            >
              {showPw ? "hide password" : "show password"}
            </button>
          </div>
        </div>

        {/* Confirm password */}
        <div className="flex flex-col gap-2">
          <label
            htmlFor="confirm"
            className="text-[20px] font-medium flex items-center gap-2"
          >
            <span>Retype Password</span>
            <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-[#E37E72] text-white text-sm font-bold">
              i
            </span>
          </label>
          <input
            id="confirm"
            type={showPw ? "text" : "password"}
            className="w-full rounded-md border border-[#6E1B1B] bg-white text-black px-4 py-2.5 text-lg outline-none focus:ring-2 focus:ring-[#4A0A0A]/30"
            required
          />
        </div>

        {/* Error: User exists message */}
        {error && (
          <div className="text-red-700 bg-red-100 px-4 py-2 rounded">
            {error}
          </div>
        )}
        {userExists && (
          <div className="bg-[#DFC9A9] px-4 py-2 rounded">
            An account already exists under this email. Enter a new email or {" "}
            <Link href="/" className="underline font-bold text-[#4A0A0A]">
            login
            </Link>
          </div>
        )}

        {/* Sign Up success */}
        {success && (
          <div className="bg-[#DFC9A9] px-4 py 2 rounded">
            Sign up was successful! Redirecting to login...
          </div>
        )}

        {/* Sign Up button */}
        <div className="flex justify-center pt-4">
          <button
            type="submit"
            className="rounded-full bg-[#4A0A0A] text-white text-xl font-semibold px-10 py-3 hover:opacity-95 transition"
          >
            Sign Up
          </button>
        </div>

        {/* Back to role selection link */}
        <p className="text-center text-lg mt-4">
          Not your role? Back to{" "}
          <Link
            href="/signup"
            className="underline underline-offset-4 hover:opacity-80 font-bold"
          >
            Role Selection
          </Link>
        </p>
      </form>

      {/* Bottom-right help button */}
      <Link
        href="/help"
        aria-label="Help"
        className="fixed bottom-6 right-6 flex h-12 w-12 items-center justify-center rounded-full bg-[#E37E72] text-white text-2xl font-bold shadow-md hover:shadow-lg"
      >
        ?
      </Link>
    </div>
  );
}
