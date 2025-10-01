'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Search } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

type ShiftKey = 'morning' | 'afternoon' | 'evening';

type Shift = {
  label: string;
  start: string;
  end: string;
  carers: string[];
};

type Schedule = Record<ShiftKey, Shift>;
type SchedulesByDate = Record<string, Schedule>;

const THEME = {
  bg: '#fff4e6',
  header: '#3d0000',
  accent: '#E07A5F',
  border: '#3d0000',
};

const makeDefaultSchedule = (): Schedule => ({
  morning: { label: 'Morning', start: '07:00', end: '16:00', carers: [] },
  afternoon: { label: 'Afternoon', start: '15:30', end: '22:00', carers: [] },
  evening: { label: 'Evening', start: '21:30', end: '07:30', carers: [] },
});

function todayISO() {
  const d = new Date();
  const off = d.getTimezoneOffset();
  const local = new Date(d.getTime() - off * 60_000);
  return local.toISOString().slice(0, 10);
}

export default function CarerShiftSchedulePage() {
  const [selectedDate, setSelectedDate] = useState<string>(todayISO());
  const [byDate, setByDate] = useState<SchedulesByDate>({});

  const [knownCarers, setKnownCarers] = useState<string[]>([
    'Hannah Brown',
    'John Smith',
    'Florence Edwards',
    'Michael Chen',
    'Aisha Patel',
  ]);

  const [selectedCarer, setSelectedCarer] = useState<Record<ShiftKey, string>>({
    morning: '',
    afternoon: '',
    evening: '',
  });
  const [query, setQuery] = useState('');

  // ---- Load from localStorage once ----
  useEffect(() => {
    const rawByDate = localStorage.getItem('carerShiftScheduleByDate');
    const rawKnown = localStorage.getItem('knownCarers');

    if (rawByDate) {
      try {
        const parsed: SchedulesByDate = JSON.parse(rawByDate);
        if (!parsed[selectedDate]) parsed[selectedDate] = makeDefaultSchedule();
        setByDate(parsed);
      } catch {}
    } else {
      setByDate({ [selectedDate]: makeDefaultSchedule() });
    }

    if (rawKnown) {
      try {
        const saved = JSON.parse(rawKnown);
        if (Array.isArray(saved) && saved.length) setKnownCarers(saved);
      } catch {}
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('carerShiftScheduleByDate', JSON.stringify(byDate));
  }, [byDate]);

  useEffect(() => {
    localStorage.setItem('knownCarers', JSON.stringify(knownCarers));
  }, [knownCarers]);

  useEffect(() => {
    if (knownCarers.length === 0) {
      const set = new Set<string>();
      Object.values(byDate).forEach((sch) =>
        (Object.keys(sch) as ShiftKey[]).forEach((k) =>
          sch[k].carers.forEach((c) => set.add(c))
        )
      );
      if (set.size) setKnownCarers(Array.from(set).sort());
    }
  }, [byDate, knownCarers.length]);

  const ensureDate = (prev: SchedulesByDate): Schedule =>
    prev[selectedDate] ?? makeDefaultSchedule();

  const setTime = (key: ShiftKey, field: 'start' | 'end', val: string) => {
    setByDate((prev) => {
      const day = ensureDate(prev);
      const nextDay: Schedule = {
        ...day,
        [key]: { ...day[key], [field]: val },
      };
      return { ...prev, [selectedDate]: nextDay };
    });
  };

  const addCarer = (key: ShiftKey) => {
    const name = (selectedCarer[key] || '').trim();
    if (!name) return;
    setByDate((prev) => {
      const day = ensureDate(prev);
      if (day[key].carers.includes(name)) return prev;
      const nextDay: Schedule = {
        ...day,
        [key]: { ...day[key], carers: [...day[key].carers, name] },
      };
      return { ...prev, [selectedDate]: nextDay };
    });
    setSelectedCarer((s) => ({ ...s, [key]: '' }));
  };

  const removeCarer = (key: ShiftKey, name: string) => {
    setByDate((prev) => {
      const day = ensureDate(prev);
      const nextDay: Schedule = {
        ...day,
        [key]: {
          ...day[key],
          carers: day[key].carers.filter((c) => c !== name),
        },
      };
      return { ...prev, [selectedDate]: nextDay };
    });
  };

  const shiftDate = (days: number) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + days);
    const off = d.getTimezoneOffset();
    d.setMinutes(d.getMinutes() - off); // keep local
    const iso = d.toISOString().slice(0, 10);
    setSelectedDate(iso);
    setByDate((prev) =>
      prev[iso] ? prev : { ...prev, [iso]: makeDefaultSchedule() }
    );
    setSelectedCarer({ morning: '', afternoon: '', evening: '' });
  };

  const schedule: Schedule = byDate[selectedDate] ?? makeDefaultSchedule();

  const filteredKeys: ShiftKey[] = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return ['morning', 'afternoon', 'evening'];
    return (Object.keys(schedule) as ShiftKey[]).filter((k) => {
      const s = schedule[k];
      return (
        s.label.toLowerCase().includes(q) ||
        s.start.includes(q) ||
        s.end.includes(q) ||
        s.carers.some((c) => c.toLowerCase().includes(q))
      );
    });
  }, [query, schedule]);

  return (
    <main className="min-h-screen" style={{ background: THEME.bg }}>
      <header
        className="flex items-center justify-between px-6 py-3"
        style={{ background: THEME.header, color: 'white' }}
      >
        <div className="flex items-center gap-8">
          <Link href="/management_empty_dashboard" className="shrink-0">
            <Image
              src="/dashboardLogo.png"
              alt="Dashboard Logo"
              width={60}
              height={60}
              className="cursor-pointer"
              priority
            />
          </Link>

          <span className="font-semibold text-lg">Staff Schedule</span>
          <Link
            href="/management_empty_dashboard/staff"
            className="hover:underline"
          >
            Staff List
          </Link>
        </div>

        <Link href="/management_empty_dashboard/profile">
          <div
            className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center cursor-pointer hover:bg-white/30 transition"
            title="Profile"
          >
            <span>👤</span>
          </div>
        </Link>
      </header>

      <div style={{ background: '#f3d9c9', height: 10 }} />

      {/* ===== Section header ===== */}
      <div
        className="px-6 py-3 text-white text-xl font-semibold"
        style={{ background: THEME.header }}
      >
        Manage Shifts
      </div>

      {/* ===== Content ===== */}
      <section className="px-6 py-6 max-w-5xl mx-auto space-y-6">
        {/* Controls */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => shiftDate(-1)}
              className="h-9 w-9 rounded-full border border-[#3d0000] text-[#3d0000]"
              title="Previous day"
            >
              ←
            </button>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-4 h-9 rounded-full border border-[#3d0000]/40 text-[#3d0000] bg-white"
            />
            <button
              onClick={() => shiftDate(1)}
              className="h-9 w-9 rounded-full border border-[#3d0000] text-[#3d0000]"
              title="Next day"
            >
              →
            </button>
          </div>

          {/* Search bar */}
          <div className="flex items-center gap-3 bg-white rounded-full pl-4 pr-3 h-9 w-full sm:w-[360px] border border-[#3d0000]/30">
            <Search
              size={18}
              strokeWidth={2}
              className="text-[#3d0000] shrink-0"
            />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search for staff"
              className="w-full outline-none text-[#3d0000]"
            />
          </div>
        </div>

        {/* Table header */}
        <div className="grid grid-cols-12 rounded-xl border px-4 py-3 font-semibold text-[#3d0000] bg-white border-[#3d0000]/20">
          <div className="col-span-3">Shift</div>
          <div className="col-span-2">Start</div>
          <div className="col-span-2">End</div>
          <div className="col-span-5">Carers</div>
        </div>

        {/* Table rows */}
        <div>
          {(filteredKeys as ShiftKey[]).map((key) => {
            const s = schedule[key];
            return (
              <div
                key={key}
                className="grid grid-cols-12 text-black items-start gap-4 rounded-xl mt-4 px-4 py-4"
              >
                <div className="col-span-3 text-[#3d0000] font-semibold">
                  {s.label}
                </div>

                <div className="col-span-2">
                  <input
                    type="time"
                    value={s.start}
                    onChange={(e) => setTime(key, 'start', e.target.value)}
                    className="w-full px-3 py-2 rounded-md border bg-white"
                  />
                </div>

                <div className="col-span-2">
                  <input
                    type="time"
                    value={s.end}
                    onChange={(e) => setTime(key, 'end', e.target.value)}
                    className="w-full px-3 py-2 rounded-md border bg-white"
                  />
                </div>

                <div className="col-span-5">
                  {s.carers.length > 0 ? (
                    <div className="flex flex-wrap gap-2 mb-3">
                      {s.carers.map((c) => (
                        <span
                          key={c}
                          className="inline-flex items-center gap-2 px-3 py-1 rounded-full border"
                          style={{
                            borderColor: `${THEME.border}33`,
                            background: THEME.bg,
                          }}
                        >
                          {c}
                          <button
                            onClick={() => removeCarer(key, c)}
                            className="text-sm leading-none px-2 py-0.5 rounded-md border hover:bg-gray-100"
                            title="Remove"
                          >
                            ✕
                          </button>
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 mb-2">No carers assigned yet</p>
                  )}

                  <div className="flex items-center gap-2">
                    <select
                      value={selectedCarer[key]}
                      onChange={(e) =>
                        setSelectedCarer((s) => ({
                          ...s,
                          [key]: e.target.value,
                        }))
                      }
                      className="w-full px-3 py-2 rounded-md border bg-white"
                    >
                      <option value="">Select carer…</option>
                      {knownCarers.map((n) => (
                        <option key={n} value={n}>
                          {n}
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={() => addCarer(key)}
                      disabled={!selectedCarer[key]}
                      className={`rounded-full px-3 py-2 text-white ${
                        !selectedCarer[key]
                          ? 'opacity-50 cursor-not-allowed'
                          : ''
                      }`}
                      style={{ background: THEME.accent }}
                      title={
                        !selectedCarer[key]
                          ? 'Select a carer first'
                          : 'Add carer'
                      }
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </main>
  );
}
