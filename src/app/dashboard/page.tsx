import Image from "next/image";
import CalendarPanel from "@/components/calendar/CalendarPanel";
import TasksPanel from "@/components/tasks/TasksPanel";


export default function DashboardPage() {
  return (
    <div className="min-h-screen">
      <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch px-6">
        {/* LEFT: Calendar card */}
        <section className="flex flex-col rounded-2xl overflow-hidden bg-[#F7ECD9] border border-black/10">
          {/* Maroon header */}
          <div className="bg-[#3d0000] text-white px-5 py-6 flex items-center justify-between">
            {/* Left side */}
            <div className="text-lg font-semibold flex items-center gap-3">
              <span
                className="inline-flex items-center justify-center h-7 w-7 rounded-full bg-white/15"
                aria-hidden
              >
                ≡
              </span>

              <span>Dashboard</span>
              <Image
                src="/dashboardLogo.png"
                alt="App Logo"
                width={80}
                height={80}
                className="object-contain"
              />
            </div>

            {/* Right side */}
            <div className="flex items-center gap-3">
              <span>Florence Edwards</span>
              <Image
                src="/florence.jpg"
                alt="Profile Picture"
                width={80}
                height={80}
                className="rounded-full border border-white object-cover"
              />
            </div>
          </div>

          {/* Body */}
          <div className="p-5 flex-1">
            <CalendarPanel />
          </div>
        </section>

        {/* RIGHT: Tasks card */}
        <section className="flex flex-col rounded-2xl overflow-hidden bg-[#F7ECD9] border border-black/10">
          {/* Maroon header */}
          <div className="bg-[#3d0000] text-white px-5 py-12.5">
            <h2 className="text-lg font-semibold">Tasks</h2>
          </div>

          {/* Body */}
          <div className="p-5 flex-1">
            <TasksPanel />
          </div>
        </section>
      </div>
    </div>
  );
}
