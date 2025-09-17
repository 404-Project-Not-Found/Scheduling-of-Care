'use client';

import React from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

export default function PartialDashboardPage() {
  const router = useRouter();

  function handleProfileClick() {
    router.push('/client-profile');
  }

  return (
    <div className="h-screen w-full bg-[#FAEBDC] flex flex-col items-center justify-start p-6">
      {/* Top Bar */}
      <div className="w-full max-w-5xl bg-[#4A0A0A] text-white flex items-center justify-between px-6 py-3 rounded-t-lg">
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
        >
          <span className="text-base">Florence Edwards</span>
          <div className="w-10 h-10 rounded-full overflow-hidden border">
            <Image
              src="/avatar.png"
              alt="User avatar"
              width={40}
              height={40}
              className="object-cover"
            />
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="w-full max-w-5xl flex-1 bg-[#FAEBDC] border-x-2 border-b-2 border-purple-600 rounded-b-lg">
        {/* Notification Banner */}
        <div className="bg-[#F9C9B1] px-4 py-3 flex items-start gap-2 border-b border-[#e2b197]">
          <p className="text-sm text-[#4A0A0A]">
            Your dashboard currently has partial functionality until the
            management completes registration for your client. You will receive
            an email once it&apos;s done
          </p>
        </div>

        {/* Empty Box Area */}
        <div className="flex-1"></div>
      </div>
    </div>
  );
}
