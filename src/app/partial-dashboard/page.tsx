"use client";

import React, { Suspense } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";

// Wrapper with Suspense for useSearchParams
export default function PartialDashboardPage() {
  return (
    <Suspense fallback={<div className="p-6">Loading dashboard...</div>}>
      <PartialDashboardInner />
    </Suspense>
  );
}

function PartialDashboardInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const displayName = searchParams.get("name") || "Florence Edwards";
  const dob = searchParams.get("dob") || "";

  function handleProfileClick() {
    const q = new URLSearchParams();
    q.set("name", displayName);
    if (dob) q.set("dob", dob);
    router.push(`/client-profile?${q.toString()}`);
  }

  return (
    <div className="min-h-screen w-full bg-[#FAEBDC] flex items-center justify-center p-6">
      {/* Centered, wider card container */}
      <div className="w-full max-w-5xl">
        {/* Top Bar */}
        <div className="w-full bg-[#4A0A0A] text-white flex items-center justify-between px-6 py-3 rounded-t-lg">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold">Dashboard</h2>
            <Image
              src="/logo-name.png"
              alt="Scheduling of Care Logo"
              width={160}
              height={40}
              className="object-contain"
              priority
            />
          </div>

          <div
            className="flex items-center gap-3 cursor-pointer"
            onClick={handleProfileClick}
            title="View profile"
          >
            <span className="text-base">{displayName}</span>
            <div className="w-10 h-10 rounded-full overflow-hidden border">
              {/* 👉 changed to public/default_profile.png */}
              <Image
                src="/default_profile.png"
                alt="Default user avatar"
                width={40}
                height={40}
                className="object-cover"
                priority
              />
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="w-full bg-[#FAEBDC] border-4 border-[#4A0A0A] rounded-b-lg overflow-hidden h-[520px]">
          <div className="bg-[#F9C9B1] px-4 py-3 flex items-start gap-2 border-b border-[#e2b197]">
            <p className="text-sm text-[#4A0A0A]">
              Your dashboard currently has partial functionality until the
              management completes registration for your client. You will
              receive an email once it&apos;s done.
            </p>
          </div>
          <div className="h-full" />
        </div>
      </div>
    </div>
  );
}

