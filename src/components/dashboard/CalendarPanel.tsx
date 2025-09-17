"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import dayGridPlugin from "@fullcalendar/daygrid";
import Pill from "@/components/Pill";
import "@/styles/fullcalendar.css";


const FullCalendar = dynamic(() => import("@fullcalendar/react"), { ssr: false });

export default function CalendarPanel() {
  return (
    <>
      <FullCalendar
        plugins={[dayGridPlugin]}
        initialView="dayGridMonth"
        headerToolbar={{
          left: "prev",    // left arrow
          center: "title", // month + year title in middle
          right: "next",   // right arrow
        }}
        height="auto"
      />

      {/* Pills row */}
      <div className="mt-4 flex items-center justify-center gap-4 px-6">
        <Pill href="/dashboard/cost-reports" label="Cost Reports" className="w-36" />
        <Pill href="/dashboard/requests" label="Requests: 1" className="w-36" />

        <Link
          href="/help"
          aria-label="Help"
          className="inline-flex items-center justify-center h-9 w-9 rounded-full
            bg-[#E37E72] text-white leading-none"
        >
          <span className="-translate-y-[1px] text-base font-semibold">?</span>
        </Link>
      </div>

      
    </>
  );
}

