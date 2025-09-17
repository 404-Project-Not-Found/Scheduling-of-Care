export default function TasksPanel() {
  return (
    <div className="h-full">
      <ul className="space-y-3">
        <li className="w-full bg-white text-black border rounded px-3 py-2">
          <div>Dental Appointment 9:00AM</div>
          <p className="text-sm text-gray-600">Next due: 22nd July 2025</p>
        </li>
        <li className="w-full bg-white text-black border rounded px-3 py-2">
          <div>Replace Toothbrush Head</div>
          <p className="text-sm text-gray-600">Next due: 23rd July 2025</p>
        </li>
      </ul>

      <div className="mt-4 flex justify-end">
        <button className="rounded-full px-4 py-2 bg-[#FFFFFF] text-black">Print</button>
      </div>
    </div>
  );
}
