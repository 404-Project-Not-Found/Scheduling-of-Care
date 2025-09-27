"use client";

import Image from "next/image";
import CalendarPanel from "@/components/calendar/CalendarPanel";
import TasksPanel from "@/components/tasks/TasksPanel";
import SideMenu from "@/components/side-menu/SideMenu";
import { useState } from "react";

export default function DashboardPage() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="min-h-screen">
      <SideMenu open={menuOpen} onClose={() => setMenuOpen(false)} />
      <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch px-6">
        {/* LEFT: Calendar card */}
        <section className="flex flex-col rounded-2xl overflow-hidden bg-[#F7ECD9] border border-black/10">
          {/* Maroon header */}
          <div className="bg-[#3d0000] text-white px-5 py-6 flex items-center justify-between">
            <div className="text-lg font-semibold flex items-center gap-3">
              <button
                type="button"
                onClick={() => setMenuOpen(true)}
                className="inline-flex items-center justify-center h-7 w-7 rounded-full bg-white/15"
                aria-label="Open menu"
              >
                ≡
              </button>
              <span>Dashboard</span>
              <Image
                src="/dashboardLogo.png"
                alt="App Logo"
                width={80}
                height={80}
                className="object-contain"
              />
            </div>

            {/* <div className="flex items-center gap-3">
              <span>Florence Edwards</span>
              <Image
                src="/florence.jpg"
                alt="Profile Picture"
                width={80}
                height={80}
                className="rounded-full border border-white object-cover"
              />
            </div> */}
          </div>

          {/* Body */}
          <div className="p-5 flex-1">
            <CalendarPanel />
          </div>
        </section>

        {/* RIGHT: Tasks card */}
        <section className="flex flex-col rounded-2xl overflow-hidden bg-[#F7ECD9] border border-black/10">
          <div className="bg-[#3d0000] text-white px-5 py-12.5">
            <h2 className="text-lg font-semibold">Tasks</h2>
          </div>

          <div className="p-5 flex-1">
            <TasksPanel />
          </div>
        </section>
      </div>
    </div>
  );
}
