"use client";

import dynamic from "next/dynamic";
import dayGridPlugin from "@fullcalendar/daygrid";
import "@/styles/fullcalendar.css";

const FullCalendar = dynamic(() => import("@fullcalendar/react"), { ssr: false });

type CalendarViewProps = {
  height?: number | "auto";
};

export default function CalendarView({ height = "auto" }: CalendarViewProps) {
  return (
    <FullCalendar
      plugins={[dayGridPlugin]}
      initialView="dayGridMonth"
      headerToolbar={{
        left: "prev",
        center: "title",
        right: "next",
      }}
      height={height}
    />
  );
}