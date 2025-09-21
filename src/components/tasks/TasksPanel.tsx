"use client";

import { Task } from "@/app/dashboard/types"; // import from types

type TasksPanelProps = {
  tasks: Task[];
  onTaskClick: (task: Task) => void;
};

export default function TasksPanel({ tasks, onTaskClick }: TasksPanelProps) {
  const sortedTasks = [...tasks].sort(
    (a, b) => new Date(a.nextDue).getTime() - new Date(b.nextDue).getTime()
  );

  return (
    <div className="h-full flex flex-col">
      <ul className="space-y-3">
        {sortedTasks.map((t) => (
          <li
            key={t.id}
            className="w-full bg-white text-black border rounded px-3 py-2 cursor-pointer hover:bg-gray-100"
            onClick={() => onTaskClick(t)}
          >
            <div className="font-bold">{t.title}</div>
            <p className="text-sm text-gray-700">Next due: {t.nextDue}</p>
            <p className="text-sm text-gray-700">Status: {t.status || "Pending"}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
