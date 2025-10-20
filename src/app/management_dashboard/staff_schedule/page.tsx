/**
 * File path: src/app/management_dashboard/staff_schedule/page.tsx
 * Frontend Author: Devni Wijesinghe
 
 * Last Updated by Denise Alexander - 16/10/2025: back-end integrated to fetch staff
 * shift schedules from DB.
 */

'use client';

import {
  ChevronLeft,
  ChevronRight,
  Search,
  Settings,
  Printer,
  UserRoundCog,
} from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardChrome from '@/components/top_menu/client_schedule';
import { getViewerRole } from '@/lib/data';
import '@/app/globals.css';

/* ---- Colors ---- */
const palette = {
  header: '#3A0000',
  banner: '#F9C9B1',
  text: '#2b2b2b',
  pageBg: '#fff4e6',
  border: '#3d0000',
  accent: '#E07A5F',
  peachSoft: 'rgba(249,201,177,0.55)', // buttons default (no border)
  peachHover: 'rgba(249,201,177,0.9)', // hover deeper
};

/* ---- Types ---- */
type Staff = {
  id: string;
  name: string;
  role?: 'Carer' | 'Management';
  org?: string;
  email?: string;
};

type ShiftEntry = { id?: string; start: string; end: string; label?: string };

type ScheduleByStaff = Record<string, Record<string, ShiftEntry>>;

interface StaffApiResponse {
  _id: string;
  name: string;
  role: string;
  org: string;
  email: string;
}

interface ShiftApiResponse {
  staffId: string;
  date: string;
  start: string;
  end: string;
  label?: string;
}

/* ---- Helper Functions ---- */
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

export default function StaffSchedulePage() {
  const router = useRouter();
  const onLogoClick = () => router.push('/management_dashboard');

  /* ---- States ---- */
  const [role, setRole] = useState<'family' | 'carer' | 'management' | null>(
    null
  );
  const [staff, setStaff] = useState<Staff[]>([]);
  const [schedule, setSchedule] = useState<ScheduleByStaff>({});
  const [weekStart, setWeekStart] = useState<Date>(() =>
    startOfWeek(new Date())
  );

  const [modal, setModal] = useState<{
    open: boolean;
    staffId?: string;
    dateISO?: string;
    start?: string;
    end?: string;
    label?: string;
  }>({ open: false });

  const [shiftPresets, setShiftPresets] = useState({
    Morning: { start: '07:00', end: '15:00' },
    Afternoon: { start: '15:00', end: '22:00' },
    Evening: { start: '22:00', end: '07:00' },
  });

  const [search, setSearch] = useState('');
  const [settingsOpen, setSettingsOpen] = useState(false);

  const isManagement = role === 'management';
  const isReadonly = !isManagement;

  // Fetch staff & shifts
  useEffect(() => {
    (async () => {
      const r = await getViewerRole();
      setRole(r);

      try {
        /* ---- Staff ---- */
        const resStaff = await fetch('/api/v1/management/staff');
        const staffData = await resStaff.json();
        const staffArray: StaffApiResponse[] = Array.isArray(staffData.staff)
          ? staffData.staff
          : [];

        // Map API data to local Staff type
        setStaff(
          staffArray.map((s) => ({
            id: s._id,
            name: s.name,
            role: s.role === 'management' ? 'Management' : 'Carer',
            org: s.org,
            email: s.email,
          }))
        );

        /* ---- Shifts ---- */
        const resShifts = await fetch('/api/v1/shifts');
        const data = await resShifts.json();
        const shifts: ShiftApiResponse[] = Array.isArray(data.shifts)
          ? data.shifts
          : [];
        const scheduleMap: ScheduleByStaff = {};
        shifts.forEach((shift) => {
          if (!scheduleMap[shift.staffId]) scheduleMap[shift.staffId] = {};
          scheduleMap[shift.staffId][shift.date] = {
            start: shift.start,
            end: shift.end,
            label: shift.label,
          };
        });
        setSchedule(scheduleMap);
      } catch (err) {
        console.error('Error fetching staff or shifts:', err);
      }
    })();
  }, []);

  /* ---- Computed values ---- */
  const days = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(weekStart);
      d.setDate(weekStart.getDate() + i);
      return d;
    });
  }, [weekStart]);

  const visibleStaff = useMemo<Staff[]>(() => {
    const q = search.trim().toLocaleLowerCase();
    if (!q) return staff;

    return staff.filter((s) => {
      return (
        s.name.toLowerCase().includes(q) ||
        (s.role?.toLowerCase().includes(q) ?? false) ||
        (s.org?.toLowerCase().includes(q) ?? false)
      );
    });
  }, [staff, search]);

  const getShift = (staffId: string, dateISO: string) =>
    schedule?.[staffId]?.[dateISO];

  const weekLabel = useMemo(() => {
    const a = days[0];
    const b = days[6];
    const opts: Intl.DateTimeFormatOptions = {
      day: 'numeric',
      month: 'short',
    };
    return `${a.toLocaleDateString(undefined, opts)} - ${b.toLocaleDateString(undefined, opts)}`;
  }, [days]);

  /* ---- Actions ---- */
  const changeWeek = (weeks: number) => {
    const newDate = new Date(weekStart);
    newDate.setDate(newDate.getDate() + weeks * 7);
    setWeekStart(startOfWeek(newDate));
  };

  const openAssignModal = (staffId: string, dateISO: string) => {
    if (isReadonly) return;
    const existing = schedule?.[staffId]?.[dateISO];
    setModal({
      open: true,
      staffId,
      dateISO,
      start: existing?.start || '',
      end: existing?.end || '',
      label: existing?.label || '',
    });
  };

  const saveModal = async () => {
    console.log(
      'Saving shift',
      modal.staffId,
      modal.dateISO,
      modal.start,
      modal.end,
      modal.label
    );

    if (!modal.staffId || !modal.dateISO) return setModal({ open: false });
    const { staffId, dateISO, start = '', end = '', label = '' } = modal;
    try {
      await fetch('/api/v1/shifts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ staffId, date: dateISO, start, end, label }),
      });
      setSchedule((prev) => {
        const newSchedule = { ...prev };
        if (!newSchedule[staffId]) newSchedule[staffId] = {};
        newSchedule[staffId][dateISO] = { start, end, label };
        return newSchedule;
      });
    } catch (err) {
      console.error('Error saving shift:', err);
    }

    setModal({ open: false });
  };

  const deleteShift = async (staffId: string, dateISO: string) => {
    try {
      await fetch(`/api/v1/shifts?staffId=${staffId}&date=${dateISO}`, {
        method: 'DELETE',
      });

      setSchedule((prev) => {
        const sch = { ...prev };
        if (sch[staffId]) delete sch[staffId][dateISO];
        return sch;
      });
    } catch (err) {
      console.error('Error deleting shift:', err);
    }
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: palette.pageBg }}>
      <DashboardChrome
        hideBanner={true}
        page="staff-schedule"
        headerTitle="Staff Schedule"
        bannerTitle=""
        showClientPicker={false}
        navItems={[
          {
            label: 'Staff List',
            href: '/management_dashboard/staff_list',
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
        {/* Top toolbar */}
        <div className="flex items-center justify-between px-6 py-4">
          {/* Week nav + Management buttons */}
          <div className="flex items-center justify-between w-full gap-4">
            {/* Week navigation */}
            <div className="flex items-center justify-center gap-3 mt-6 mb-2">
              <button
                onClick={() => changeWeek(-1)}
                className="p-2 rounded-full border border-[#3A0000]/20 bg-white hover:bg-white transition shadow-sm"
                style={{ color: palette.header }}
              >
                <ChevronLeft size={22} strokeWidth={2.5} />
              </button>

              <div
                className="px-5 py-2 rounded-full bg-white font-semibold text-lg tracking-wide text-center shadow-sm"
                style={{
                  color: palette.header,
                  border: '1px solid rgba(58,0,0,0.25)',
                  minWidth: '180px',
                }}
              >
                {weekLabel}
              </div>

              <button
                onClick={() => changeWeek(1)}
                className="p-2 rounded-full border border-[#3A0000]/20 bg-white hover:bg-white transition shadow-sm"
                style={{ color: palette.header }}
              >
                <ChevronRight size={22} strokeWidth={2.5} />
              </button>
            </div>

            <div className="flex items-center gap-3">
              {isManagement && (
                <>
                  <button
                    className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white hover:bg-white transition border border-[#3A0000]/20 text-[#3A0000] font-semibold text-base shadow-sm"
                    onClick={() =>
                      router.push('/management_dashboard/staff_list')
                    }
                  >
                    <UserRoundCog size={18} />
                    Manage Staff
                  </button>
                  <button
                    onClick={() => setSettingsOpen(true)}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white hover:bg-white transition border border-[#3A0000]/20 text-[#3A0000] font-semibold text-base shadow-sm"
                  >
                    <Settings size={18} />
                    Shift Settings
                  </button>
                </>
              )}
              <button
                onClick={() => typeof window !== 'undefined' && window.print()}
                className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white hover:bg-white transition border border-[#3A0000]/20 text-[#3A0000] font-semibold text-base shadow-sm"
              >
                <Printer size={18} />
                Print
              </button>
            </div>
          </div>
        </div>

        {/* Divider */}
        <hr className="mt-2 mb-4 w-340 mx-auto border-t border-[#3A0000]/25 rounded-full" />

        {/* Table */}
        <section className="w-full px-6 py-3">
          <div className="overflow-x-auto rounded-2xl">
            <table className="w-full table-auto border-collapse text-black">
              <thead>
                <tr style={{ backgroundColor: palette.header }}>
                  <th
                    className="p-3 py-5 text-left border"
                    style={{ color: 'white', verticalAlign: 'middle' }}
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-semibold text-lg whitespace-nowrap">
                        Staff
                      </span>

                      <div className="relative w-full max-w-[200px]">
                        <input
                          value={search}
                          onChange={(e) => setSearch(e.target.value)}
                          placeholder="Search..."
                          className="w-full h-8 rounded-full bg-white text-black text-sm border px-8"
                          style={{
                            borderColor: 'rgba(255,255,255,0.5)',
                          }}
                        />
                        <Search
                          size={16}
                          className="absolute left-2 top-1/2 -translate-y-1/2 text-black/60 pointer-events-none"
                        />
                      </div>
                    </div>
                  </th>

                  {days.map((d) => {
                    const label = d.toLocaleDateString(undefined, {
                      weekday: 'short',
                      day: 'numeric',
                      month: 'short',
                    });
                    const iso = isoDate(d);
                    return (
                      <th
                        key={iso}
                        className="p-3 py-5 text-center border"
                        style={{
                          backgroundColor: palette.header,
                          color: 'white',
                        }}
                      >
                        <div className="flex flex-col items-center">
                          <span className="text-sm">{label}</span>
                          <span className="text-sm">{iso}</span>
                        </div>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {visibleStaff.map((s) => (
                  <tr key={s.id}>
                    {/* Carer cell */}
                    <td
                      className="p-3 py-5 align-top border"
                      style={{ backgroundColor: 'white' }}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-[#3d0000] font-semibold"
                            style={{
                              boxShadow: '0 0 0 2px rgba(61,0,0,0.25) inset',
                            }}
                          >
                            {s.name
                              .split(' ')
                              .map((n) => n[0])
                              .slice(0, 2)
                              .join('')}
                          </div>
                          <div>
                            <div className="font-medium text-black">
                              {s.name}
                            </div>
                            <div className="text-sm text-black/70">
                              {s.email ? s.email : ''}
                            </div>
                            <div className="text-sm text-black/70">
                              {s.org ? s.org : ''}
                              {` · ${s.role || 'Carer'}`}
                            </div>
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Day cells */}
                    {days.map((d) => {
                      const iso = isoDate(d);
                      const shift = getShift(s.id, iso);
                      const isToday = iso === isoDate(new Date());

                      // Extract shift details safely
                      const shiftLabel = shift?.label || 'Custom';
                      const shiftStart = shift?.start || '';
                      const shiftEnd = shift?.end || '';
                      const dur =
                        shiftStart && shiftEnd
                          ? shiftDuration(shiftStart, shiftEnd)
                          : '';
                      return (
                        <td
                          key={iso}
                          className="p-3 py-5 text-center border"
                          style={{
                            backgroundColor: isToday ? '#d7c1bbff' : 'white',
                          }}
                        >
                          {shift ? (
                            <div
                              className="inline-flex flex-col items-center justify-center gap-3 rounded-2xl px-4 py-3"
                              style={{
                                backgroundColor: isToday
                                  ? 'white'
                                  : palette.pageBg,
                              }}
                            >
                              <div className="text-sm text-black font-semibold">
                                {(shiftLabel === 'Morning' && 'Morning') ||
                                  (shiftLabel === 'Afternoon' && 'Afternoon') ||
                                  (shiftLabel === 'Evening' && 'Evening') ||
                                  'Custom'}{' '}
                                ({shiftStart} — {shiftEnd})
                              </div>
                              <div className="text-xs text-black/70">
                                ({dur})
                              </div>

                              {isManagement && (
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => openAssignModal(s.id, iso)}
                                    className="text-xs px-3 py-1 rounded-2xl font-semibold transition-colors"
                                    style={{
                                      backgroundColor: palette.peachSoft,
                                      color: palette.header,
                                    }}
                                    onMouseEnter={(e) =>
                                      (e.currentTarget.style.backgroundColor =
                                        palette.peachHover)
                                    }
                                    onMouseLeave={(e) =>
                                      (e.currentTarget.style.backgroundColor =
                                        palette.peachSoft)
                                    }
                                  >
                                    Edit
                                  </button>
                                  <button
                                    onClick={() => deleteShift(s.id, iso)}
                                    className="text-xs px-3 py-1 rounded-2xl font-semibold transition-colors"
                                    style={{
                                      backgroundColor: palette.peachSoft,
                                      color: palette.header,
                                    }}
                                    onMouseEnter={(e) =>
                                      (e.currentTarget.style.backgroundColor =
                                        palette.peachHover)
                                    }
                                    onMouseLeave={(e) =>
                                      (e.currentTarget.style.backgroundColor =
                                        palette.peachSoft)
                                    }
                                  >
                                    Remove
                                  </button>
                                </div>
                              )}
                            </div>
                          ) : (
                            isManagement && (
                              <button
                                onClick={() => openAssignModal(s.id, iso)}
                                className="text-sm text-[#3d0000] underline"
                              >
                                Add Shift
                              </button>
                            )
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

        {isManagement && settingsOpen && (
          <div className="fixed inset-0 bg-black/40 z-40 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-lg w-full max-w-md p-6 text-black">
              <h3 className="text-lg font-semibold mb-4">Shift Settings</h3>
              {(['Morning', 'Afternoon', 'Evening'] as const).map((key) => (
                <div
                  key={key}
                  className="flex items-center justify-between mb-3"
                >
                  <div className="w-24">{key}</div>
                  <input
                    type="time"
                    value={shiftPresets[key].start}
                    onChange={(e) =>
                      setShiftPresets((p) => ({
                        ...p,
                        [key]: { ...p[key], start: e.target.value },
                      }))
                    }
                    className="px-2 py-2 rounded-2xl text-sm"
                    style={{ backgroundColor: '#f7f7f7' }}
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
                    className="px-2 py-2 rounded-2xl text-sm"
                    style={{ backgroundColor: '#f7f7f7' }}
                  />
                </div>
              ))}
              <div className="flex justify-end mt-4">
                <button
                  onClick={() => setSettingsOpen(false)}
                  className="px-4 py-2 rounded-2xl font-semibold transition-colors"
                  style={{
                    backgroundColor: palette.peachSoft,
                    color: palette.header,
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.backgroundColor = palette.peachHover)
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.backgroundColor = palette.peachSoft)
                  }
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {isManagement && modal.open && modal.staffId && modal.dateISO && (
          <div className="fixed inset-0 bg-black/40 z-40 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-lg w-full max-w-md p-6 text-black">
              <h3 className="text-lg font-semibold mb-3">Assign Shift</h3>
              <p className="text-sm mb-3">
                <strong>Staff:</strong>{' '}
                {staff.find((c) => c.id === modal.staffId)?.name} ·{' '}
                <strong>Date:</strong> {modal.dateISO}
              </p>
              <label className="block mb-2 text-sm">Presets</label>
              <div className="flex gap-2 mb-4 flex-wrap">
                {Object.entries(shiftPresets).map(([key, { start, end }]) => (
                  <button
                    key={key}
                    onClick={() =>
                      setModal((m) => ({ ...m, label: key, start, end }))
                    }
                    className="px-3 py-2 rounded-2xl text-sm font-semibold transition-colors"
                    style={{
                      backgroundColor:
                        modal.label === key
                          ? palette.peachHover
                          : palette.peachSoft,
                      color: palette.header,
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.backgroundColor =
                        palette.peachHover)
                    }
                    onMouseLeave={(e) => {
                      if (modal.label !== key)
                        e.currentTarget.style.backgroundColor =
                          palette.peachSoft;
                    }}
                  >
                    {key}
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
                  className="px-3 py-2 rounded-2xl text-sm font-semibold transition-colors"
                  style={{
                    backgroundColor:
                      modal.label === 'Custom'
                        ? palette.peachHover
                        : palette.peachSoft,
                    color: palette.header,
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.backgroundColor = palette.peachHover)
                  }
                  onMouseLeave={(e) => {
                    if (modal.label !== 'Custom')
                      e.currentTarget.style.backgroundColor = palette.peachSoft;
                  }}
                >
                  Custom
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-4">
                <label className="flex flex-col text-sm">
                  <span className="text-xs mb-1">Start</span>
                  <input
                    type="time"
                    value={modal.start || ''}
                    onChange={(e) =>
                      modal.label === 'Custom'
                        ? setModal((m) => ({ ...m, start: e.target.value }))
                        : null
                    }
                    disabled={modal.label !== 'Custom'}
                    className={`px-3 py-2 rounded-2xl text-black ${modal.label !== 'Custom' ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                    style={{
                      backgroundColor:
                        modal.label !== 'Custom' ? '#eee' : '#f7f7f7',
                    }}
                  />
                </label>
                <label className="flex flex-col text-sm">
                  <span className="text-xs mb-1">End</span>
                  <input
                    type="time"
                    value={modal.end || ''}
                    onChange={(e) =>
                      modal.label === 'Custom'
                        ? setModal((m) => ({ ...m, end: e.target.value }))
                        : null
                    }
                    disabled={modal.label !== 'Custom'}
                    className={`px-3 py-2 rounded-2xl text-black ${modal.label !== 'Custom' ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                    style={{
                      backgroundColor:
                        modal.label !== 'Custom' ? '#eee' : '#f7f7f7',
                    }}
                  />
                </label>
              </div>

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setModal({ open: false })}
                  className="px-4 py-2 rounded-2xl font-semibold transition-colors"
                  style={{
                    backgroundColor: palette.peachSoft,
                    color: palette.header,
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.backgroundColor = palette.peachHover)
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.backgroundColor = palette.peachSoft)
                  }
                >
                  Cancel
                </button>
                <button
                  onClick={saveModal}
                  className="px-4 py-2 rounded-2xl font-semibold transition-colors"
                  style={{
                    backgroundColor: palette.peachSoft,
                    color: palette.header,
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.backgroundColor = palette.peachHover)
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.backgroundColor = palette.peachSoft)
                  }
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
