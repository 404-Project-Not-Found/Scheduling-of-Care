// src/app/management_empty_dashboard/staff_schedule_calendar/page.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";

type Carer = { id: string; name: string };
type ShiftEntry = { start: string; end: string }; // e.g. "07:00", "15:30"
type ScheduleByCarer = Record<string, Record<string, ShiftEntry | undefined>>; // carerId -> dateISO -> shift

const THEME = {
  bg: "#fff4e6",
  header: "#3d0000",
  accent: "#E07A5F",
  border: "#3d0000",
};

function isoDate(d: Date) {
  const tzOff = d.getTimezoneOffset();
  const local = new Date(d.getTime() - tzOff * 60000);
  return local.toISOString().slice(0, 10);
}

function startOfWeek(date: Date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day; // Monday start
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function shiftDuration(start: string, end: string) {
  try {
    const [sh, sm] = start.split(":").map(Number);
    const [eh, em] = end.split(":").map(Number);
    let diff = (eh * 60 + em) - (sh * 60 + sm);
    if (diff < 0) diff += 24 * 60;
    const hours = diff / 60;
    return `${hours % 1 === 0 ? hours.toFixed(0) : hours.toFixed(1)}h`;
  } catch {
    return "";
  }
}

const DEMO_CARERS: Carer[] = [
  { id: "c-hannah", name: "Hannah Brown" },
  { id: "c-john", name: "John Smith" },
  { id: "c-florence", name: "Florence Edwards" },
  { id: "c-michael", name: "Michael Chen" },
];

const DEMO_SCHEDULE: ScheduleByCarer = {
  "c-hannah": {
    "2025-10-06": { start: "07:00", end: "15:00" },
    "2025-10-08": { start: "15:30", end: "22:00" },
  },
  "c-john": {
    "2025-10-07": { start: "09:30", end: "17:00" },
    "2025-10-06": { start: "14:00", end: "22:00" },
  },
  "c-florence": {
    "2025-10-09": { start: "21:30", end: "07:30" },
  },
  "c-michael": {},
};

export default function StaffScheduleCalendarPage() {
  const [anchorDateISO, setAnchorDateISO] = useState<string>(isoDate(new Date()));
  const anchorDate = useMemo(() => new Date(anchorDateISO), [anchorDateISO]);
  const [weekStart, setWeekStart] = useState<Date>(() => startOfWeek(new Date()));

  const [carers, setCarers] = useState<Carer[]>(() => {
    try {
      const raw = typeof window !== "undefined" && localStorage.getItem("staff_carers");
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length) return parsed;
      }
    } catch {}
    return DEMO_CARERS;
  });

  const [schedule, setSchedule] = useState<ScheduleByCarer>(() => {
    try {
      const raw = typeof window !== "undefined" && localStorage.getItem("staff_schedule_by_carer");
      if (raw) {
        const parsed = JSON.parse(raw);
        return parsed || DEMO_SCHEDULE;
      }
    } catch {}
    return DEMO_SCHEDULE;
  });

  const [search, setSearch] = useState<string>("");
  const [modal, setModal] = useState<{
    open: boolean;
    carerId?: string;
    dateISO?: string;
    start?: string;
    end?: string;
  }>({ open: false });

  useEffect(() => {
    try {
      const d = new Date(anchorDateISO);
      setWeekStart(startOfWeek(d));
    } catch {
      setWeekStart(startOfWeek(new Date()));
    }
  }, [anchorDateISO]);

  useEffect(() => {
    try {
      localStorage.setItem("staff_carers", JSON.stringify(carers));
      localStorage.setItem("staff_schedule_by_carer", JSON.stringify(schedule));
    } catch {}
  }, [carers, schedule]);

  const days = useMemo(() => {
    const arr: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(weekStart);
      d.setDate(weekStart.getDate() + i);
      arr.push(d);
    }
    return arr;
  }, [weekStart]);

  const prevWeek = () => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() - 7);
    setWeekStart(startOfWeek(d));
    setAnchorDateISO(isoDate(d));
  };
  const nextWeek = () => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + 7);
    setWeekStart(startOfWeek(d));
    setAnchorDateISO(isoDate(d));
  };
  const goToToday = () => {
    const today = new Date();
    setWeekStart(startOfWeek(today));
    setAnchorDateISO(isoDate(today));
    setSearch("");
  };

  const openAssignModal = (carerId: string, dateISO: string) => {
    const existing = schedule?.[carerId]?.[dateISO];
    setModal({
      open: true,
      carerId,
      dateISO,
      start: existing?.start || "07:00",
      end: existing?.end || "15:00",
    });
  };

  const saveModal = () => {
    if (!modal.carerId || !modal.dateISO) return setModal({ open: false });
    const { carerId, dateISO, start = "", end = "" } = modal;
    setSchedule((prev) => {
      const copy: ScheduleByCarer = JSON.parse(JSON.stringify(prev || {}));
      if (!copy[carerId]) copy[carerId] = {};
      if (!start && !end) {
        delete copy[carerId][dateISO];
      } else {
        copy[carerId][dateISO] = { start, end };
      }
      return copy;
    });
    setModal({ open: false });
  };

  const removeShift = (carerId: string, dateISO: string) => {
    setSchedule((prev) => {
      const copy: ScheduleByCarer = JSON.parse(JSON.stringify(prev || {}));
      if (copy[carerId]) {
        delete copy[carerId][dateISO];
      }
      return copy;
    });
  };

  const visibleCarers = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return carers;
    return carers.filter((c) => c.name.toLowerCase().includes(q));
  }, [carers, search]);

  const getShift = (carerId: string, dateISO: string) => {
    return schedule?.[carerId]?.[dateISO];
  };

  const weekLabel = useMemo(() => {
    const a = days[0];
    const b = days[6];
    const opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "short" };
    return `${a.toLocaleDateString(undefined, opts)} — ${b.toLocaleDateString(undefined, opts)}`;
  }, [days]);

  const addCarerQuick = (name: string) => {
    if (!name.trim()) return;
    const id = "c-" + name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-_]/g, "");
    if (carers.some((c) => c.id === id || c.name === name)) {
      alert("Carer already exists");
      return;
    }
    setCarers((prev) => [...prev, { id, name }]);
  };

  return (
    <main className="min-h-screen" style={{ background: THEME.bg }}>
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4" style={{ background: THEME.header, color: "white" }}>
        <div className="flex items-center gap-8">
          <Link href="/management_empty_dashboard" className="shrink-0">
            <Image src="/dashboardLogo.png" alt="Dashboard Logo" width={60} height={60} className="cursor-pointer" priority />
          </Link>

          <div className="flex flex-col">
            <div className="flex items-baseline gap-3">
              <h1 className="text-lg font-semibold">Staff Schedule</h1>
              <nav className="text-sm text-white/90 flex gap-3 items-center">
              </nav>
            </div>
            <div className="text-sm text-white/80">Manage who is on shift and set shift hours</div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-white rounded-full pl-3 pr-2 h-10 border" style={{ borderColor: `${THEME.border}66` }}>
            <button onClick={prevWeek} className="px-2 h-8 rounded-full hover:bg-gray-100 text-[#3d0000]">◀</button>
            <input
              type="date"
              value={anchorDateISO}
              onChange={(e) => setAnchorDateISO(e.target.value)}
              className="outline-none text-sm"
              style={{ color: "#3d0000" }}
              title="Jump to date"
            />
            <button onClick={nextWeek} className="px-2 h-8 rounded-full hover:bg-gray-100 text-[#3d0000]">▶</button>
          </div>

          <div className="flex items-center gap-3">
            <button onClick={goToToday} className="px-4 py-1 rounded-full text-sm border" style={{ borderColor: THEME.border, color: THEME.border, background: "white" }}>Today</button>
            <Link href="/management_empty_dashboard/profile">
              <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 cursor-pointer">
                <span>👤</span>
              </div>
            </Link>
          </div>
        </div>
      </header>

      <div style={{ background: "#f3d9c9", height: 8 }} />

      {/* Section title */}
      <div className="max-w-6xl mx-auto px-6 mt-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold" style={{ color: THEME.header }}>Staff schedule</h2>
            <div className="text-sm text-black/70">Week: <span className="font-medium text-black">{weekLabel}</span></div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-white rounded-full pl-3 pr-3 h-10 border" style={{ borderColor: `${THEME.border}66` }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3d0000" strokeWidth="2"><circle cx="11" cy="11" r="6"/><path d="M21 21l-4.35-4.35"/></svg>
              <input
                placeholder="Search staff"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="outline-none text-sm w-48"
                style={{ color: "#000" }}
              />
              {search && (
                <button onClick={() => setSearch("")} className="text-sm text-[#3d0000] px-2">✕</button>
              )}
            </div>
            <QuickAddCarer onAdd={(name) => addCarerQuick(name)} />
          </div>
        </div>
      </div>

      {/* Calendar */}
      <section className="max-w-6xl mx-auto px-6 py-6">
        <div className="overflow-x-auto rounded-lg border" style={{ borderColor: THEME.border }}>
          <table className="w-full table-auto border-collapse text-black">
            <thead>
              <tr className="bg-[#fffaf6]">
                <th className="p-3 text-left" style={{ borderRight: `2px solid ${THEME.border}` }}>Staff</th>
                {days.map((d) => {
                  const label = d.toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" });
                  const iso = isoDate(d);
                  const isToday = iso === isoDate(new Date());
                  return (
                    <th key={iso} className="p-3 text-center" style={{ minWidth: 120, borderRight: `2px solid ${THEME.border}`, borderBottom: `2px solid ${THEME.border}`, color: "#000" }}>
                      <div className="flex flex-col items-center">
                        <span className={`text-sm ${isToday ? "font-semibold text-red-600" : "text-black"}`}>{label}</span>
                        <span className="text-xs text-black/60">{iso}</span>
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>

            <tbody>
              {visibleCarers.length === 0 && (
                <tr><td colSpan={8} className="p-6 text-center text-gray-500">No carers found.</td></tr>
              )}

              {visibleCarers.map((carer) => (
                <tr key={carer.id} className="border-t" style={{ borderTop: `1px solid ${THEME.border}` }}>
                  <td className="p-3 align-top" style={{ width: 220, borderRight: `2px solid ${THEME.border}` }}>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-[#3d0000] font-semibold border" style={{ borderColor: `${THEME.border}33` }}>
                        {carer.name.split(" ").map(n => n[0]).slice(0,2).join("")}
                      </div>
                      <div className="flex flex-col">
                        <div className="font-medium text-black">{carer.name}</div>
                        <div className="text-sm text-black/70">Carer</div>
                      </div>
                    </div>
                  </td>

                  {days.map((d) => {
                    const iso = isoDate(d);
                    const s = getShift(carer.id, iso);
                    return (
                      <td key={iso} className="p-3 align-top text-center" style={{ borderRight: `1px solid ${THEME.border}33` }}>
                        {s ? (
                          <div className="inline-flex items-center justify-between gap-2 bg-[#fff4ec] border rounded px-3 py-2" style={{ borderColor: THEME.border }}>
                            <div className="text-sm text-black font-semibold">
                              {s.start} — {s.end} ({shiftDuration(s.start, s.end)})
                            </div>
                            <div className="flex gap-1">
                              <button onClick={() => openAssignModal(carer.id, iso)} className="text-xs px-2 py-1 border rounded" style={{ borderColor: THEME.border }}>Edit</button>
                              <button onClick={() => removeShift(carer.id, iso)} className="text-xs px-2 py-1 border rounded text-red-700" style={{ borderColor: THEME.border }}>Remove</button>
                            </div>
                          </div>
                        ) : (
                          <div>
                            <button onClick={() => openAssignModal(carer.id, iso)} className="text-sm text-[#3d0000] underline">Assign</button>
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Modal */}
      {modal.open && modal.carerId && modal.dateISO && (
        <div className="fixed inset-0 bg-black/40 z-40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-lg w-full max-w-md p-6 text-black">
            <h3 className="text-lg font-semibold mb-3">Assign shift</h3>
            <p className="text-sm mb-3">
              <strong>Carer:</strong> {carers.find(c => c.id === modal.carerId)?.name} &nbsp; · &nbsp; 
              <strong>Date:</strong> {modal.dateISO}
            </p>

            <div className="grid grid-cols-2 gap-3 mb-4">
              <label className="flex flex-col text-sm">
                <span className="text-xs mb-1">Start time</span>
                <input type="time" value={modal.start || ""} onChange={(e) => setModal((m) => ({ ...m, start: e.target.value }))} className="px-3 py-2 border rounded text-black" />
              </label>
              <label className="flex flex-col text-sm">
                <span className="text-xs mb-1">End time</span>
                <input type="time" value={modal.end || ""} onChange={(e) => setModal((m) => ({ ...m, end: e.target.value }))} className="px-3 py-2 border rounded text-black" />
              </label>
            </div>

            <div className="flex items-center justify-end gap-3">
              <button onClick={() => setModal({ open: false })} className="px-4 py-2 rounded-md border text-black" style={{ borderColor: THEME.border }}>Cancel</button>
              <button onClick={saveModal} className="px-4 py-2 rounded-md text-white" style={{ background: THEME.accent }}>Save</button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

function QuickAddCarer({ onAdd }: { onAdd: (name: string) => void }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");

  const submit = () => {
    if (!name.trim()) return;
    onAdd(name.trim());
    setName("");
    setOpen(false);
  };

  if (!open) {
    return <button onClick={() => setOpen(true)} className="px-3 py-1 rounded-full text-sm border bg-white" style={{ borderColor: THEME.border, color: THEME.border }}>+ Add staff</button>;
  }

  return (
    <div className="flex items-center gap-2">
      <input
        autoFocus
        placeholder="Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="px-2 py-1 rounded border text-sm"
        style={{ borderColor: THEME.border, color: "#000" }}
        onKeyDown={(e) => e.key === "Enter" && submit()}
      />
      <button onClick={submit} className="px-3 py-1 rounded-full text-sm border bg-white" style={{ borderColor: THEME.border, color: THEME.border }}>Add</button>
      <button onClick={() => setOpen(false)} className="px-2 py-1 text-sm text-red-700">✕</button>
    </div>
  );
}
