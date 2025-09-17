"use client";

import React, { Suspense, useEffect, useState } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";

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

  const [name, setName] = useState<string>("");
  const [dob, setDob] = useState<string>("");

  useEffect(() => {
    const qName = searchParams.get("name");
    const qDob = searchParams.get("dob") || "";

    if (qName) {
      setName(qName);
      setDob(qDob);
      try {
        localStorage.setItem("currentClientName", qName);
        localStorage.setItem("currentClientDob", qDob);
      } catch {}
      return;
    }

    try {
      const savedName = localStorage.getItem("currentClientName");
      const savedDob = localStorage.getItem("currentClientDob") || "";
      if (savedName) {
        setName(savedName);
        setDob(savedDob);
        return;
      }
    } catch {}

    setName("Florence Edwards");
    setDob("");
  }, [searchParams]);

  function handleProfileClick() {
    const q = new URLSearchParams();
    if (name) q.set("name", name);
    if (dob) q.set("dob", dob);
    router.push(`/client-profile?${q.toString()}`);
  }

  return (
    <div className="min-h-screen w-full bg-[#FAEBDC] flex items-center justify-center p-6">
      {/* Shared container so the orange button and the card align on the left */}
      <div className="w-full max-w-5xl relative pt-16 -mt-10">
        {/* Orange button (aligned with card left) */}
        <button
          onClick={() => router.push("/clients_list")}
          className="absolute left-0 top-0 px-4 py-2 rounded-md font-semibold border transition
                     bg-[#ff9900] border-[#f08a00] text-[#4A0A0A] hover:bg-[#f08a00] active:bg-[#e68100]"
          aria-label="Return to your client list"
          title="Return to your client list"
        >
          Back to Client List
        </button>

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
            <span className="text-base">{name || "…"}</span>
            <div className="w-10 h-10 rounded-full overflow-hidden border">
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

        {/* Content Area (adjust height here if needed) */}
        <div className="w-full bg-[#FAEBDC] border-4 border-[#4A0A0A] rounded-b-lg overflow-hidden h-[480px]">
          <div className="bg-[#F9C9B1] px-4 py-3 flex items-start gap-2 border-b border-[#e2b197]">
            <p className="text-sm text-[#4A0A0A]">
              This dashboard currently has partial functionality until the
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
