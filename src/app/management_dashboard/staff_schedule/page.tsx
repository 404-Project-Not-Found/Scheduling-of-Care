'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import DashboardChrome from '@/components/top_menu/client_schedule';
import '@/app/globals.css';

/* ---- Match the calendar page palette ---- */
const palette = {
  header: '#3A0000',
  banner: 'rgba(249, 201, 177, 0.7)',
  text: '#2b2b2b',
  pageBg: '#fff4e6',
};

/* ---------------- Types ---------------- */
type Carer = { id: string; name: string; role?: 'Carer' | 'Management' };
type ShiftEntry = { start: string; end: string; label?: string };
type ScheduleByCarer = Record<string, Record<string, ShiftEntry | undefined>>;

/* -------------- Helpers --------------- */
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
    const [sh, sm] = start.split(':').map(Number);
    const [eh, em] = end.split(':').map(Number);
    let diff = eh * 60 + em - (sh * 60 + sm);
    if (diff < 0) diff += 24 * 60;
    const hours = diff / 60;
    return `${hours % 1 === 0 ? hours.toFixed(0) : hours.toFixed(1)}h`;
  } catch {
    return '';
  }
}

/* -------------- Demo data -------------- */
const DEMO_CARERS: Carer[] = [
  { id: 'c-hannah', name: 'Hannah Brown', role: 'Carer' },
  { id: 'c-john', name: 'John Smith', role: 'Carer' },
  { id: 'c-florence', name: 'Florence Edwards', role: 'Carer' },
  { id: 'c-michael', name: 'Michael Chen', role: 'Carer' },
];
const DEMO_SCHEDULE: ScheduleByCarer = {
  'c-hannah': {
    '2025-10-06': { start: '07:00', end: '15:00', label: 'Morning' },
  },
  'c-john': {
    '2025-10-07': { start: '15:00', end: '22:00', label: 'Afternoon' },
  },
  'c-florence': {
    '2025-10-09': { start: '22:00', end: '07:00', label: 'Evening' },
  },
  'c-michael': {},
};

/* =================== Page =================== */
export default function StaffSchedulePage() {
  const router = useRouter();
  const onLogoClick = () => router.push('/management_dashboard');

  /* State copied from your timetable view */
  const [weekStart, setWeekStart] = useState<Date>(() =>
    startOfWeek(new Date())
  );
  const [anchorDateISO, setAnchorDateISO] = useState<string>(
    isoDate(new Date())
  );
  const [carers, setCarers] = useState<Carer[]>(() => {
    try {
      const raw = localStorage.getItem('staff_carers');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length) return parsed;
      }
    } catch {}
    return DEMO_CARERS;
  });
  const [schedule, setSchedule] = useState<ScheduleByCarer>(() => {
    try {
      const raw = localStorage.getItem('staff_schedule_by_carer');
      if (raw) {
        const parsed = JSON.parse(raw);
        return parsed || DEMO_SCHEDULE;
      }
    } catch {}
    return DEMO_SCHEDULE;
  });
  const [shiftPresets, setShiftPresets] = useState({
    Morning: { start: '07:00', end: '15:00' },
    Afternoon: { start: '15:00', end: '22:00' },
    Evening: { start: '22:00', end: '07:00' },
  });
  const [search, setSearch] = useState<string>('');
  const [modal, setModal] = useState<{
    open: boolean;
    carerId?: string;
    dateISO?: string;
    start?: string;
    end?: string;
    label?: string;
  }>({ open: false });
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [addCarerModal, setAddCarerModal] = useState<{
    open: boolean;
    name?: string;
    role: 'Carer' | 'Management';
  }>({ open: false, role: 'Carer' });

  useEffect(() => {
    localStorage.setItem('staff_carers', JSON.stringify(carers));
    localStorage.setItem('staff_schedule_by_carer', JSON.stringify(schedule));
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

  const changeWeek = (weeks: number) => {
    const newDate = new Date(weekStart);
    newDate.setDate(newDate.getDate() + weeks * 7);
    setWeekStart(startOfWeek(newDate));
    setAnchorDateISO(isoDate(newDate));
  };
  const goToToday = () => {
    const today = new Date();
    setWeekStart(startOfWeek(today));
    setAnchorDateISO(isoDate(today));
    setSearch('');
  };

  const openAssignModal = (carerId: string, dateISO: string) => {
    const existing = schedule?.[carerId]?.[dateISO];
    setModal({
      open: true,
      carerId,
      dateISO,
      start: existing?.start || '',
      end: existing?.end || '',
      label: existing?.label || '',
    });
  };
  const saveModal = () => {
    if (!modal.carerId || !modal.dateISO) return setModal({ open: false });
    const { carerId, dateISO, start = '', end = '', label = '' } = modal;
    setSchedule((prev) => {
      const copy: ScheduleByCarer = structuredClone(prev || {});
      if (!copy[carerId]) copy[carerId] = {};
      copy[carerId][dateISO] = { start, end, label };
      return copy;
    });
    setModal({ open: false });
  };
  const removeShift = (carerId: string, dateISO: string) => {
    setSchedule((prev) => {
      const copy: ScheduleByCarer = structuredClone(prev || {});
      delete copy[carerId]?.[dateISO];
      return copy;
    });
  };
  const visibleCarers = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return carers;
    return carers.filter((c) => c.name.toLowerCase().includes(q));
  }, [carers, search]);
  const getShift = (carerId: string, dateISO: string) =>
    schedule?.[carerId]?.[dateISO];

  const weekLabel = useMemo(() => {
    const a = days[0];
    const b = days[6];
    const opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' };
    return `${a.toLocaleDateString(undefined, opts)} — ${b.toLocaleDateString(undefined, opts)}`;
  }, [days]);

  const addCarer = () => {
    const name = addCarerModal.name?.trim();
    if (!name) return;
    const id =
      'c-' +
      name
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-_]/g, '');
    if (carers.some((c) => c.id === id || c.name === name)) {
      alert('Carer Already Exists');
      return;
    }
    setCarers((prev) => [...prev, { id, name, role: addCarerModal.role }]);
    setAddCarerModal({ open: false, role: 'Carer' });
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: palette.banner }}>
      <DashboardChrome
        page="schedule"
        headerTitle="Staff Schedule"
        bannerTitle=""
        showClientPicker={false}
        navItems={[
          { label: 'Staff List', href: '/management_dashboard/staff_list' },
          {
            label: 'Assign Carer',
            href: '/management_dashboard/assign_carer/manage',
          },
        ]}
        clients={[]}
        onClientChange={() => {}}
        colors={{
          header: palette.header,
          banner: palette.banner,
          text: palette.text,
        }}
        onLogoClick={onLogoClick}
      >
        <div
          className="relative z-10 w-full px-6 md:px-8 py-0 md:py-0 flex items-center justify-between flex-wrap gap-3 -mt-8 md:-mt-10"
          style={{
            color: palette.header,
            marginTop: '-28px',
          }}
        >
          <div className="flex items-center justify-between gap-2 flex-wrap">
            {/* LEFT: week picker */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => changeWeek(-1)}
                className="h-9 px-3 rounded border bg-white"
                style={{ borderColor: '#00000022', color: palette.header }}
                aria-label="Previous week"
              >
                ◀
              </button>

              <div className="font-semibold">{weekLabel}</div>

              <button
                onClick={() => changeWeek(1)}
                className="h-9 px-3 rounded border bg-white"
                style={{ borderColor: '#00000022', color: palette.header }}
                aria-label="Next week"
              >
                ▶
              </button>
            </div>

            {/* RIGHT: search + actions */}
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Search staff"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-9 w-60 md:w-72 rounded-lg border px-3 text-black bg-white focus:outline-none focus:ring-2 focus:ring-[#F9C9B1]"
              />

              <button
                onClick={goToToday}
                className="h-9 px-4 rounded-full text-sm border bg-white"
                style={{ borderColor: '#00000022', color: palette.header }}
                title="Jump to current week"
              >
                Today
              </button>

              <button
                onClick={() => setSettingsOpen(true)}
                className="h-9 px-4 rounded-full text-sm border bg-white"
                style={{ borderColor: '#00000022', color: palette.header }}
                title="Shift presets"
              >
                ⚙ Shifts
              </button>

              <button
                onClick={() => setAddCarerModal({ open: true, role: 'Carer' })}
                className="h-9 px-4 rounded-full text-sm border bg-white"
                style={{ borderColor: '#00000022', color: palette.header }}
                title="Add a staff member"
              >
                + Add Staff
              </button>
            </div>
          </div>
        </div>

        {/* Main content */}
        <section className="w-full" style={{ backgroundColor: palette.banner }}>
          <div className="max-w-6xl mx-auto px-6 md:px-10 py-8">
            <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
              <h2
                className="text-2xl font-extrabold"
                style={{ color: palette.header }}
              >
                {/* Staff */}
              </h2>
            </div>

            <div
              className="overflow-x-auto rounded-lg border bg-white"
              style={{ borderColor: `${palette.header}22` }}
            >
              <table className="w-full table-auto border-collapse text-black">
                <thead>
                  <tr className="bg-[#fffaf6]">
                    <th
                      className="p-3 text-left border-r-2"
                      style={{ borderColor: `${palette.header}55` }}
                    >
                      Staff
                    </th>
                    {days.map((d) => {
                      const label = d.toLocaleDateString(undefined, {
                        weekday: 'short',
                        day: 'numeric',
                        month: 'short',
                      });
                      const iso = isoDate(d);
                      const isToday = iso === isoDate(new Date());
                      return (
                        <th
                          key={iso}
                          className="p-3 text-center border-r-2 border-b-2"
                          style={{ borderColor: `${palette.header}55` }}
                        >
                          <div className="flex flex-col items-center">
                            <span
                              className={`text-sm ${isToday ? 'font-semibold text-red-600' : 'text-black'}`}
                            >
                              {label}
                            </span>
                            <span className="text-xs text-black/60">{iso}</span>
                          </div>
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  {visibleCarers.map((carer) => (
                    <tr
                      key={carer.id}
                      className="border-t"
                      style={{ borderColor: `${palette.header}55` }}
                    >
                      <td
                        className="p-3 align-top border-r-2"
                        style={{ borderColor: `${palette.header}55` }}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div
                              className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-[#3d0000] font-semibold border"
                              style={{ borderColor: `${palette.header}33` }}
                            >
                              {carer.name
                                .split(' ')
                                .map((n) => n[0])
                                .slice(0, 2)
                                .join('')}
                            </div>
                            <div>
                              <div className="font-medium text-black">
                                {carer.name}
                              </div>
                              <div className="text-sm text-black/70">
                                {carer.role || 'Carer'}
                              </div>
                            </div>
                          </div>
                          <button
                            onClick={() => {
                              if (
                                !confirm(
                                  `Are you sure you want to delete ${carer.name}?`
                                )
                              )
                                return;
                              setCarers((prev) =>
                                prev.filter((c) => c.id !== carer.id)
                              );
                              setSchedule((prev) => {
                                const copy = { ...prev };
                                delete copy[carer.id];
                                return copy;
                              });
                            }}
                            className="px-2 py-1 text-xs border rounded text-red-700 bg-white"
                            style={{ borderColor: `${palette.header}55` }}
                          >
                            Delete
                          </button>
                        </div>
                      </td>

                      {days.map((d) => {
                        const iso = isoDate(d);
                        const s = getShift(carer.id, iso);
                        return (
                          <td
                            key={iso}
                            className="p-3 text-center border-r"
                            style={{ borderColor: `${palette.header}22` }}
                          >
                            {s ? (
                              <div
                                className="inline-flex flex-col items-center justify-center gap-1 bg-[#fff4ec] border rounded px-3 py-2"
                                style={{ borderColor: `${palette.header}55` }}
                              >
                                <div className="text-sm text-black font-semibold">
                                  {s.label || 'Custom'} ({s.start} — {s.end})
                                </div>
                                <div className="text-xs text-black/70">
                                  ({shiftDuration(s.start, s.end)})
                                </div>
                                <div className="flex gap-1">
                                  <button
                                    onClick={() =>
                                      openAssignModal(carer.id, iso)
                                    }
                                    className="text-xs px-2 py-1 border rounded bg-white"
                                    style={{
                                      borderColor: `${palette.header}55`,
                                    }}
                                  >
                                    Edit
                                  </button>
                                  <button
                                    onClick={() => removeShift(carer.id, iso)}
                                    className="text-xs px-2 py-1 border rounded text-red-700 bg-white"
                                    style={{
                                      borderColor: `${palette.header}55`,
                                    }}
                                  >
                                    Remove
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <button
                                onClick={() => openAssignModal(carer.id, iso)}
                                className="text-sm underline"
                                style={{ color: palette.header }}
                              >
                                Assign
                              </button>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Add Staff Modal */}
        {addCarerModal.open && (
          <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-lg w-full max-w-md p-6 text-black">
              <h3 className="text-lg font-semibold mb-3">Add Staff</h3>
              <label className="block mb-2 text-sm">Name</label>
              <input
                type="text"
                value={addCarerModal.name || ''}
                onChange={(e) =>
                  setAddCarerModal((prev) => ({
                    ...prev,
                    name: e.target.value,
                  }))
                }
                className="w-full border px-3 py-2 rounded mb-3"
              />
              <label className="block mb-2 text-sm">Role</label>
              <select
                value={addCarerModal.role}
                onChange={(e) =>
                  setAddCarerModal((prev) => ({
                    ...prev,
                    role: e.target.value as 'Carer' | 'Management',
                  }))
                }
                className="w-full border px-3 py-2 rounded mb-4"
              >
                <option>Carer</option>
                <option>Management</option>
              </select>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() =>
                    setAddCarerModal({ open: false, role: 'Carer' })
                  }
                  className="px-4 py-2 rounded-md border"
                  style={{ borderColor: `${palette.header}55` }}
                >
                  Cancel
                </button>
                <button
                  onClick={addCarer}
                  className="px-4 py-2 rounded-md text-white"
                  style={{ background: '#E07A5F' }}
                >
                  Add
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Shift Presets Modal */}
        {settingsOpen && (
          <div className="fixed inset-0 bg-black/40 z-40 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-lg w-full max-w-md p-6 text-black">
              <h3 className="text-lg font-semibold mb-3">Shift Settings</h3>
              {(['Morning', 'Afternoon', 'Evening'] as const).map((key) => (
                <div
                  key={key}
                  className="flex items-center justify-between mb-3"
                >
                  <div className="capitalize w-24">{key}</div>
                  <input
                    type="time"
                    value={shiftPresets[key].start}
                    onChange={(e) =>
                      setShiftPresets((p) => ({
                        ...p,
                        [key]: { ...p[key], start: e.target.value },
                      }))
                    }
                    className="border px-2 py-1 rounded text-sm"
                  />
                  <span>–</span>
                  <input
                    type="time"
                    value={shiftPresets[key].end}
                    onChange={(e) =>
                      setShiftPresets((p) => ({
                        ...p,
                        [key]: { ...p[key], end: e.target.value },
                      }))
                    }
                    className="border px-2 py-1 rounded text-sm"
                  />
                </div>
              ))}
              <div className="flex justify-end gap-3 mt-4">
                <button
                  onClick={() => setSettingsOpen(false)}
                  className="px-4 py-2 rounded-md border bg-white"
                  style={{ borderColor: `${palette.header}55` }}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Assign Shift Modal */}
        {modal.open && modal.carerId && modal.dateISO && (
          <div className="fixed inset-0 bg-black/40 z-40 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-lg w-full max-w-md p-6 text-black">
              <h3 className="text-lg font-semibold mb-3">Assign Shift</h3>
              <p className="text-sm mb-3">
                <strong>Carer:</strong>{' '}
                {carers.find((c) => c.id === modal.carerId)?.name} ·{' '}
                <strong>Date:</strong> {modal.dateISO}
              </p>

              <label className="block mb-3 text-sm">Select Shift</label>
              <div className="flex gap-2 mb-4 flex-wrap">
                {Object.entries(shiftPresets).map(([label, { start, end }]) => (
                  <button
                    key={label}
                    onClick={() =>
                      setModal((m) => ({ ...m, label, start, end }))
                    }
                    className={`px-3 py-2 border rounded text-sm ${modal.label === label ? 'bg-[#E07A5F] text-white' : 'bg-white'}`}
                    style={{ borderColor: `${palette.header}55` }}
                  >
                    {label}
                  </button>
                ))}
                <button
                  onClick={() =>
                    setModal((m) => ({
                      ...m,
                      label: 'Custom',
                      start: '',
                      end: '',
                    }))
                  }
                  className={`px-3 py-2 border rounded text-sm ${modal.label === 'Custom' ? 'bg-[#E07A5F] text-white' : 'bg-white'}`}
                  style={{ borderColor: `${palette.header}55` }}
                >
                  Custom
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-4">
                <label className="flex flex-col text-sm">
                  <span className="text-xs mb-1">Start Time</span>
                  <input
                    type="time"
                    value={modal.start || ''}
                    onChange={(e) =>
                      modal.label === 'Custom'
                        ? setModal((m) => ({ ...m, start: e.target.value }))
                        : null
                    }
                    disabled={modal.label !== 'Custom'}
                    className={`px-3 py-2 border rounded text-black ${modal.label !== 'Custom' ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                  />
                </label>
                <label className="flex flex-col text-sm">
                  <span className="text-xs mb-1">End Time</span>
                  <input
                    type="time"
                    value={modal.end || ''}
                    onChange={(e) =>
                      modal.label === 'Custom'
                        ? setModal((m) => ({ ...m, end: e.target.value }))
                        : null
                    }
                    disabled={modal.label !== 'Custom'}
                    className={`px-3 py-2 border rounded text-black ${modal.label !== 'Custom' ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                  />
                </label>
              </div>

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setModal({ open: false })}
                  className="px-4 py-2 rounded-md border bg-white"
                  style={{ borderColor: `${palette.header}55` }}
                >
                  Cancel
                </button>
                <button
                  onClick={saveModal}
                  className="px-4 py-2 rounded-md text-white"
                  style={{ background: '#E07A5F' }}
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        )}
      </DashboardChrome>
    </div>
  );
}
