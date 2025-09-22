"use client";

import { useEffect, useState } from "react";
import TasksList from "./TasksList";
import { format } from "date-fns";

type CareItem = {
  id: string;
  name: string;
  frequency: string;
  startDate: string;
  category: string;
  repeatYearly: boolean;
};

export default function TasksPanel() {
  const [careItems, setCareItems] = useState<CareItem[]>([]);

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem("careItems") || "[]");
    setCareItems(stored);
  }, []);

  const mergedTasks = careItems.map((item) => ({
    id: item.id,
    title: item.name,
    nextDue: format(new Date(item.startDate), "do MMMM yyyy"),
  }));

  return (
    <div className="h-full flex flex-col">
      <TasksList tasks={mergedTasks} />

      <div className="mt-4 flex justify-end">
        <button className="rounded-full px-4 py-2 bg-white text-black border">
          Print
        </button>
      </div>
    </div>
  );
}
