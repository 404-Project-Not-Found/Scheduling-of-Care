"use client";

import Link from "next/link";
import Pill from "@/components/ui/Pill";

type CalendarPillsProps = {
  requestsCount?: number;
};

export default function CalendarPills({ requestsCount = 1 }: CalendarPillsProps) {
  return (
    <div className="mt-4 flex items-center justify-center gap-4 px-6">
      <Pill href="/dashboard/cost-reports" label="Cost Reports" className="w-36" />
      <Pill href="/dashboard/requests" label={`Requests: ${requestsCount}`} className="w-36" />

      <Link
        href="/help"
        aria-label="Help"
        className="inline-flex items-center justify-center h-9 w-9 rounded-full
                   bg-[#E37E72] text-white leading-none"
      >
        <span className="-translate-y-[1px] text-base font-semibold">?</span>
      </Link>
    </div>
  );
}
