'use client';

import dynamic from 'next/dynamic';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import '@/styles/fullcalendar.css';

const FullCalendar = dynamic(() => import('@fullcalendar/react'), {
  ssr: false,
});

type Task = {
  id: string;
  title: string;
  nextDue: string; // YYYY-MM-DD
};

type CalendarPanelProps = {
  tasks: Task[];
  onDateClick: (date: string) => void;
};

function toUTCDateString(date: string) {
  const d = new Date(date + 'T00:00:00'); // treat as local midnight
  const yyyy = d.getUTCFullYear();
  const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(d.getUTCDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

export default function CalendarPanel({
  tasks = [],
  onDateClick,
}: CalendarPanelProps) {
  // Normalize task dates to UTC string
  const taskDatesSet = new Set(tasks.map((t) => toUTCDateString(t.nextDue)));

  // Today in UTC
  const today = new Date();
  const todayStr = `${today.getUTCFullYear()}-${String(today.getUTCMonth() + 1).padStart(2, '0')}-${String(today.getUTCDate()).padStart(2, '0')}`;

  return (
    <FullCalendar
      plugins={[dayGridPlugin, interactionPlugin]}
      initialView="dayGridMonth"
      headerToolbar={{ left: 'prev', center: 'title', right: 'next' }}
      height="auto"
      events={[]} // no text inside calendar
      dateClick={(info) => {
        const clicked = info.dateStr;
        if (taskDatesSet.has(clicked)) onDateClick(clicked);
        else onDateClick('');
      }}
      dayCellClassNames={(info) => {
        const classes: string[] = [];
        if (!info.isCurrentMonth) return classes;

        const dateStr = info.dateStr;
        if (dateStr === todayStr) classes.push('fc-today-custom');
        if (taskDatesSet.has(dateStr)) classes.push('fc-task-day');

        return classes;
      }}
    />
  );
}
