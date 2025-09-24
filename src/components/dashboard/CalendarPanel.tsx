'use client';

// <<<<<<< HEAD
// import dynamic from 'next/dynamic';
// import Link from 'next/link';
// import dayGridPlugin from '@fullcalendar/daygrid';
// import Pill from '@/components/Pill';
// import '@/styles/fullcalendar.css';

// const FullCalendar = dynamic(() => import('@fullcalendar/react'), {
//   ssr: false,
// });

// export default function CalendarPanel() {
//   return (
//     <>
//       <FullCalendar
//         plugins={[dayGridPlugin]}
//         initialView="dayGridMonth"
//         headerToolbar={{
//           left: 'prev', // left arrow
//           center: 'title', // month + year title in middle
//           right: 'next', // right arrow
//         }}
//         height="auto"
//       />

//       {/* Pills row */}
//       <div className="mt-4 flex items-center justify-center gap-4 px-6">
//         <Pill
//           href="/dashboard/cost-reports"
//           label="Cost Reports"
//           className="w-36"
//         />
//         <Pill href="/dashboard/requests" label="Requests: 1" className="w-36" />

//         <Link
//           href="/help"
//           aria-label="Help"
//           className="inline-flex items-center justify-center h-9 w-9 rounded-full
//             bg-[#E37E72] text-white leading-none"
//         >
//           <span className="-translate-y-[1px] text-base font-semibold">?</span>
//         </Link>
//       </div>
//     </>
//   );
// }

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

// Helper to format Date object as YYYY-MM-DD in local time
function formatDateToYMD(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export default function CalendarPanel({
  tasks,
  onDateClick,
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
