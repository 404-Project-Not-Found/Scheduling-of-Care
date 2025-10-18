'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useMemo } from 'react';

type Props = {
  className?: string;
  compact?: boolean;
};

export default function ViewToggle({ className, compact }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const view = (params.get('view') ?? 'calendar') as 'calendar' | 'list';

  const base = useMemo(() => {
    const p = new URLSearchParams(params.toString());
    return p;
  }, [params]);

  const change = (next: 'calendar' | 'list') => {
    const p = new URLSearchParams(base.toString());
    p.set('view', next);
    router.replace(`${pathname}?${p.toString()}`);
  };

  if (compact) {
    // simple two-button compact switch
    return (
      <div
        className={`inline-flex rounded-lg border overflow-hidden ${className ?? ''}`}
      >
        <button
          onClick={() => change('calendar')}
          className={`px-3 py-1 text-sm ${view === 'calendar' ? 'bg-[#3d0000] text-white' : 'bg-white text-[#3d0000]'}`}
          aria-pressed={view === 'calendar'}
          aria-label="Calendar view"
          title="Calendar view"
        >
          🗓
        </button>
        <button
          onClick={() => change('list')}
          className={`px-3 py-1 text-sm ${view === 'list' ? 'bg-[#3d0000] text-white' : 'bg-white text-[#3d0000]'}`}
          aria-pressed={view === 'list'}
          aria-label="List view"
          title="List view"
        >
          ☰
        </button>
      </div>
    );
  }

  return (
    <select
      value={view}
      onChange={(e) => change(e.target.value as 'calendar' | 'list')}
      className={`border rounded px-2 py-1 text-sm ${className ?? ''}`}
      aria-label="Change schedule view"
      title="Change schedule view"
    >
      <option value="calendar">Calendar</option>
      <option value="list">List</option>
    </select>
  );
}
