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
  onMonthChange?: (yyyyMm: string) => void;
};

// Helper to format Date object as YYYY-MM-DD in local time
function formatDateToYMD(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function formatMonthToYM(d: Date) {
  const y = d.getFullYear(); 
  const m = String(d.getUTCMonth() + 1).padStart(2, '0'); 
  return `${y}-${m}`;
}

export default function CalendarPanel({
  tasks,
  onDateClick,
  onMonthChange,
}: CalendarPanelProps) {
  const taskDatesSet = new Set(tasks.map((t) => t.nextDue));
  const todayStr = formatDateToYMD(new Date());

  return (
    <FullCalendar
      plugins={[dayGridPlugin, interactionPlugin]}
      initialView="dayGridMonth"
      headerToolbar={{ left: 'prev', center: 'title', right: 'next' }}
      height="auto"
      events={[]}
      fixedWeekCount={false}
      showNonCurrentDates={false}
      datesSet={(info) => {
        const month = formatMonthToYM(info.start);
        onMonthChange?.(month);
      }}
      dateClick={(info) => {
        const clickedDate = formatDateToYMD(info.date);
        if (taskDatesSet.has(clickedDate)) onDateClick(clickedDate);
        else onDateClick('');
      }}
      dayCellClassNames={(info) => {
        const dateStr = formatDateToYMD(info.date);
        const classes: string[] = [];

        if (dateStr === todayStr) classes.push('fc-today-custom');
        if (taskDatesSet.has(dateStr)) classes.push('fc-task-day');

        return classes;
      }}
    />
  );
}
