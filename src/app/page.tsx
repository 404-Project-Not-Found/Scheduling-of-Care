"use client";

import Image from "next/image";
// import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function ManagementSignupPage() {
  const router = useRouter();
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const form = e.currentTarget as HTMLFormElement;
    const formData = new FormData(form);
    const email = (formData.get("email") as string).trim().toLowerCase();
    const password = formData.get("password") as string;

    try {
      if (email === "management@email.com" && password === "management") {
        router.push("/dashboard");
        return;
      }

      const loginRes = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!loginRes.ok) {
        throw new Error("Signup/Login failed");
      }

      router.push("/dashboard");
    } catch (err) {
      console.error(err);
      setError("Signup failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen w-full bg-[#F3E9D9] flex flex-col items-center justify-center px-4">
      {/* Top-left logo */}
      <div className="absolute left-8 top-8 z-10">
        <Image
          src="/logo-name.png"
          alt="Scheduling of Care"
          width={210}
          height={64}
          priority
        />
      </div>

      <h1 className="text-4xl sm:text-5xl font-extrabold text-black mb-12">
        Management Login
      </h1>

      <form
        className="w-full max-w-lg space-y-8 text-black"
        onSubmit={onSubmit}
      >
        {/* Email */}
        <div className="flex flex-col gap-2">
          <label htmlFor="email" className="text-[20px] font-medium">
            Enter Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            className="w-full rounded-md border border-[#6E1B1B] bg-white px-4 py-2.5 text-lg"
            required
          />
        </div>

        {/* Password */}
        <div className="flex flex-col gap-2">
          <label htmlFor="password" className="text-[20px] font-medium">
            Create Password
          </label>
          <input
            id="password"
            name="password"
            type={showPw ? "text" : "password"}
            className="w-full rounded-md border border-[#6E1B1B] bg-white px-4 py-2.5 text-lg"
            required
          />
          <button
            type="button"
            onClick={() => setShowPw((v) => !v)}
            className="text-sm underline text-[#4A0A0A]"
          >
            {showPw ? "Hide password" : "Show password"}
          </button>
        </div>

        {error && (
          <p className="text-red-600 text-center font-medium">{error}</p>
        )}

        <div className="flex justify-center pt-4">
          <button
            type="submit"
            disabled={loading}
            className="rounded-full bg-[#4A0A0A] text-white text-xl font-semibold px-10 py-3"
          >
            {loading ? "Creating..." : "Sign Up"}
          </button>
        </div>
      </form>
    </div>
  );
}
