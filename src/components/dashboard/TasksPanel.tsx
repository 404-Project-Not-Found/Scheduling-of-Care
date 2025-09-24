'use client';

//   <div className="mt-4 flex justify-end">
//     <button className="rounded-full px-4 py-2 bg-[#FFFFFF] text-black">
//       Print
//     </button>
//   </div>

import { useState, useEffect } from 'react';
import { Task } from '@/app/full_dashboard/types';

type TasksPanelProps = {
  tasks: Task[];
  onTaskClick: (task: Task) => void;
};

export default function TasksPanel({ tasks, onTaskClick }: TasksPanelProps) {
  const [comments, setComments] = useState<{ id: number; text: string }[]>([]);

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem('taskComments') || '[]');
    setComments(saved);
  }, []);

  const deleteComment = (id: number) => {
    const updated = comments.filter((c) => c.id !== id);
    setComments(updated);
    localStorage.setItem('taskComments', JSON.stringify(updated));
  };

  const editComment = (id: number, newText: string) => {
    const updated = comments.map((c) =>
      c.id === id ? { ...c, text: newText } : c
    );
    setComments(updated);
    localStorage.setItem('taskComments', JSON.stringify(updated));
  };

  const sortedTasks = [...tasks].sort(
    (a, b) => new Date(a.nextDue).getTime() - new Date(b.nextDue).getTime()
  );

  return (
    <div className="h-full flex flex-col">
      <ul className="space-y-3">
        {sortedTasks.map((t) => (
          <li
            key={t.id}
            className="w-full bg-white text-black border rounded px-3 py-2"
          >
            <div
              className="font-bold cursor-pointer hover:text-[#3d0000]"
              onClick={() => onTaskClick(t)}
            >
              {t.title}
            </div>
            <p className="text-sm text-gray-700">Next due: {t.nextDue}</p>
            <p className="text-sm text-gray-700">
              Status: {t.status || 'Pending'}
            </p>

            {/* ✅ Comments Section */}
            <div className="mt-3">
              <h3 className="font-semibold text-sm">Comments:</h3>
              {comments.length === 0 && (
                <p className="text-gray-500 text-sm">No comments yet.</p>
              )}
              <ul className="mt-2 space-y-2">
                {comments.map((c) => (
                  <li
                    key={c.id}
                    className="flex justify-between items-center bg-[#fff4e6] border border-[#3d0000] rounded px-2 py-1"
                  >
                    <input
                      type="text"
                      value={c.text}
                      onChange={(e) => editComment(c.id, e.target.value)}
                      className="flex-1 bg-transparent text-black focus:outline-none"
                    />
                    <button
                      onClick={() => deleteComment(c.id)}
                      className="ml-2 text-red-600 font-bold hover:opacity-80"
                    >
                      ✕
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
