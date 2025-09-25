// src/app/carer/search/page.tsx
'use client';

import Image from 'next/image';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

// Type definition for a Carer record
type Carer = {
  id: string;
  name: string;
  deleted?: boolean; // soft-delete flag
  hasAccess?: boolean; // whether this carer has client access
};

// ---- seed data in localStorage ----
function ensureSeed() {
  if (typeof window === 'undefined') return;

  const raw = localStorage.getItem('carers');

  // If no carers stored yet, seed with initial list
  if (!raw) {
    const seed: Carer[] = [
      {
        id: 'jasmine-cook',
        name: 'Jasmine Cook',
        deleted: false,
        hasAccess: false,
      },
      { id: 'john-smith', name: 'John Smith', deleted: false, hasAccess: true },
    ];
    localStorage.setItem('carers', JSON.stringify(seed));
    return;
  }

  try {
    // Parse existing carers
    const list: Carer[] = JSON.parse(raw) as Carer[];
    const byId = new Map<string, Carer>(list.map((c) => [c.id, c]));

    const upsert = (c: Carer) => {
      if (!byId.has(c.id)) list.push(c);
    };
    upsert({
      id: 'jasmine-cook',
      name: 'Jasmine Cook',
      deleted: false,
      hasAccess: false,
    });
    upsert({
      id: 'john-smith',
      name: 'John Smith',
      deleted: false,
      hasAccess: true,
    });

    for (const c of list) {
      if (typeof c.deleted !== 'boolean') c.deleted = false;
      if (typeof c.hasAccess !== 'boolean') c.hasAccess = false;
    }

    localStorage.setItem('carers', JSON.stringify(list));
  } catch {
    // Fallback if parsing fails → reset with default seed
    localStorage.setItem(
      'carers',
      JSON.stringify([
        {
          id: 'jasmine-cook',
          name: 'Jasmine Cook',
          deleted: false,
          hasAccess: false,
        },
        {
          id: 'john-smith',
          name: 'John Smith',
          deleted: false,
          hasAccess: true,
        },
      ])
    );
  }
}

// Load all carers from localStorage
function loadCarers(): Carer[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem('carers') || '[]') as Carer[];
  } catch {
    return [];
  }
}

export default function SearchCarerPage() {
  const router = useRouter();

  // --- Local component state ---
  const [query, setQuery] = useState(''); // search input
  const [results, setResults] = useState<Carer[]>([]); // matched carers
  const [hasSearched, setHasSearched] = useState(false);

  // Ensure seed data when component first mounts
  useEffect(() => {
    ensureSeed();
  }, []);

  // Load carers whenever `hasSearched` changes (so results refresh after actions)
  const allCarers = useMemo(loadCarers, [hasSearched]);

  // Execute search by filtering carers based on query
  const runSearch = () => {
    const q = query.trim().toLowerCase();
    const hits =
      q.length === 0
        ? []
        : allCarers.filter(
            (c) => !c.deleted && c.name.toLowerCase().includes(q)
          );
    setResults(hits);
    setHasSearched(true);
  };

  // Handle input change and reset results if input is cleared
  const handleChange = (v: string) => {
    setQuery(v);
    if (v.trim() === '') {
      setResults([]);
      setHasSearched(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-[#F5CBA7] p-8">
      {/* Top-left logo */}
      <Image
        src="/logo-name.png"
        alt="Scheduling of Care"
        width={220}
        height={55}
        priority
        className="fixed top-6 left-8"
      />

      {/* Main search card */}
      <div className="w-full max-w-4xl rounded-[22px] border border-[#6b3f2a] bg-[#F7ECD9] p-10 shadow">
        <h1 className="text-3xl font-extrabold text-[#1c130f] mb-8">
          Search carers
        </h1>

        {/* Search input + button row */}
        <div className="flex items-start gap-4">
          {/* Search box with input and results list */}
          <div className="flex-1 rounded-2xl border border-[#7c5040] bg-white shadow-sm overflow-hidden flex flex-col">
            {/* Input row */}
            <div className="px-5 py-4">
              <div className="flex items-center gap-3">
                {/* Magnifying glass icon */}
                <svg
                  viewBox="0 0 24 24"
                  className="w-7 h-7 text-gray-600"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <circle cx="11" cy="11" r="7" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                <input
                  placeholder="Search for a carer"
                  value={query}
                  onChange={(e) => handleChange(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') runSearch(); // Press Enter to search
                  }}
                  className="w-full text-xl outline-none placeholder:text-[#333]/70 text-black"
                />
              </div>
            </div>

            {/* Divider line */}
            <div className="h-px w-full bg-[#7c5040]/40" />

            {/* Results list */}
            <div className="flex-1">
              {hasSearched &&
                (results.length > 0 ? (
                  <ul role="listbox" className="py-2">
                    {results.map((c) => (
                      <li key={c.id}>
                        <button
                          role="option"
                          aria-selected="false"
                          onClick={() =>
                            router.push(
                              `/carer/manage?carer=${encodeURIComponent(c.id)}`
                            )
                          }
                          className="w-full text-left px-5 py-3 text-lg text-black hover:bg-gray-300 focus:bg-gray-300 focus:outline-none transition"
                        >
                          {c.name}
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  query.trim() !== '' && (
                    <div className="py-3 px-5 text-gray-500">
                      No results found.
                    </div>
                  )
                ))}
            </div>
          </div>

          {/* Search button */}
          <button
            onClick={runSearch}
            className="h-[56px] px-6 rounded-2xl bg-[#F39C6B] hover:bg-[#ef8a50] text-[#1c130f] font-extrabold text-xl"
          >
            Search
          </button>
        </div>

        {/* Optional: add new carer button */}
        {/*
        <div className="mt-4">
          <button
            onClick={() => router.push("/carer/add")}
            className="h-[56px] px-6 rounded-2xl bg-[#F58CA8] hover:bg-[#e97995] text-black font-extrabold text-xl"
          >
            Add new carer
          </button>
        </div>
        */}
      </div>
    </main>
  );
}
