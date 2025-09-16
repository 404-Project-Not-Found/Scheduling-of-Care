"use client";

import CalendarView from "./CalendarView";
import CalendarPills from "./CalendarPills";

export default function CalendarPanel() {
  return (
    <>
      <CalendarView height="auto" />
      <CalendarPills requestsCount={1} />
    </>
  );
}
