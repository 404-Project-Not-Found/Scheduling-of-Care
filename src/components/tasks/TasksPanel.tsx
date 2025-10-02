'use client';

import { Task } from '@/app/calender_dashboard/types'; // import from types

type TasksPanelProps = {
  tasks: Task[];
  onTaskClick: (task: Task) => void;
};

// Helper function to get status color
const getStatusColor = (status: string) => {
  switch (status.toLowerCase()) {
    case 'due':
      return 'bg-red-500 text-white';
    case 'pending':
      return 'bg-orange-400 text-white';
    case 'completed':
      return 'bg-green-500 text-white';
    default:
      return 'bg-gray-300 text-black';
  }
};

export default function TasksPanel({
  tasks = [],
  onTaskClick,
}: TasksPanelProps) {
  const sortedTasks = [...tasks].sort(
    (a, b) => new Date(a.nextDue).getTime() - new Date(b.nextDue).getTime()
  );

  return (
    <div className="h-full flex flex-col">
      <ul className="space-y-3">
        {sortedTasks.map((t) => (
          <li
            key={t.id}
            className="w-full bg-white text-black border rounded px-3 py-2 cursor-pointer hover:bg-gray-100 flex justify-between items-center"
            onClick={() => onTaskClick(t)}
          >
            <div>
              <div className="font-bold">{t.title}</div>
              <p className="text-sm text-gray-700">Next due: {t.nextDue}</p>
            </div>
            <span
              className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(
                t.status || 'Pending'
              )}`}
            >
              {t.status || 'Pending'}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
