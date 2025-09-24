'use client';

export default function CalendarPills() {
  return (
    <div className="mt-4 flex items-center justify-center gap-4 px-6">
      {/* Help button with hover instructions */}
      <div className="relative group">
        <button
          type="button"
          className="inline-flex items-center justify-center h-9 w-9 rounded-full
                     bg-[#E37E72] text-white leading-none"
        >
          ?
        </button>
        <div className="absolute bottom-12 right-0 hidden group-hover:block bg-white text-black text-sm rounded-md shadow-lg p-2 w-56">
          <p className="font-semibold mb-1">Dashboard Instructions:</p>
          <ul className="list-disc list-inside space-y-1 text-xs">
            <li>Use the calendar to view scheduled items.</li>
            <li>Manage tasks in the right-hand panel.</li>
            <li>Profile info is shown at the top right.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
