"use client";

import TasksList from "./TasksList";

const TASKS = [
  { id: "1", title: "Dental Appointment 9:00AM", nextDue: "22nd July 2025" },
  { id: "2", title: "Replace Toothbrush Head", nextDue: "23rd July 2025" },
];

export default function TasksPanel() {
  return (
    <div className="h-full flex flex-col">
      <TasksList tasks={TASKS} />

      <div className="mt-4 flex justify-end">
        <button className="rounded-full px-4 py-2 bg-white text-black border">
          Print
        </button>
      </div>
    </div>
  );
}
