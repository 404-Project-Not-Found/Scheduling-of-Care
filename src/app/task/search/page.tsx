// src/app/task/search/page.tsx
"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type Task = {
  label: string;
  slug: string;
  frequency: string;
  lastDone: string;
  status: string;
  category: string;
  deleted?: boolean;
};

// seed once if empty
function ensureSeed() {
  if (typeof window === "undefined") return;
  const raw = localStorage.getItem("tasks");
  if (!raw) {
    const seed: Task[] = [
      {
        label: "Replace Toothbrush Head",
        slug: "replace-toothbrush-head",
        frequency: "every 3 months",
        lastDone: "23rd April 2025",
        status: "Completed",
        category: "Appointments",
        deleted: false,
      },
    ];
    localStorage.setItem("tasks", JSON.stringify(seed));
  }
}

function loadTasks(): Task[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem("tasks") || "[]") as Task[];
  } catch {
    return [];
  }
}

export default function SearchTaskPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Task[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const router = useRouter();

  useEffect(() => {
    ensureSeed();
  }, []);

  const allTasks = useMemo(loadTasks, [hasSearched]); // re-read after coming back

  const runSearch = () => {
    const q = query.trim().toLowerCase();
    const hits =
      q.length === 0
        ? []
        : allTasks.filter((t) => !t.deleted && t.label.toLowerCase().includes(q));
    setResults(hits);
    setHasSearched(true);
  };

  const handleChange = (v: string) => {
    setQuery(v);
    if (v.trim() === "") {
      setResults([]);
      setHasSearched(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-[#F5CBA7] p-8">
      {/* SCREEN top-left logo (outside the card) */}
      <Image
        src="/logo-name.png"
        alt="Scheduling of Care"
        width={220}
        height={55}
        priority
        className="fixed top-6 left-8"
      />

      <div className="w-full max-w-4xl rounded-[22px] border border-[#6b3f2a] bg-[#F7ECD9] p-10 shadow">
        <h1 className="text-3xl font-extrabold text-[#1c130f] mb-8">Search tasks</h1>

        <div className="flex items-start gap-4">
          {/* ONE continuous box: input + results */}
          <div className="flex-1 rounded-2xl border border-[#7c5040] bg-white shadow-sm overflow-hidden">
            {/* input row */}
            <div className="px-5 py-4">
              <div className="flex items-center gap-3">
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
                  placeholder="Search for task"
                  value={query}
                  onChange={(e) => handleChange(e.target.value)}
                  className="w-full text-xl outline-none placeholder:text-[#333]/70 text-black"
                />
              </div>
            </div>

            {/* divider */}
            <div className="h-px w-full bg-[#7c5040]/40" />

            {/* results */}
            {hasSearched &&
              (results.length > 0 ? (
                <ul role="listbox" className="py-2">
                  {results.map((r) => (
                    <li key={r.slug}>
                      <button
                        role="option"
                        onClick={() =>
                          router.push(`/task/edit?task=${encodeURIComponent(r.slug)}`)
                        }
                        className="w-full text-left px-5 py-3 text-lg text-black hover:bg-gray-300 focus:bg-gray-300 focus:outline-none transition"
                      >
                        {r.label}
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                query.trim() !== "" && (
                  <div className="py-3 px-5 text-gray-500">No results found.</div>
                )
              ))}
          </div>

          {/* Search button aligned with input height */}
          <button
            onClick={runSearch}
            className="h-[56px] px-6 rounded-2xl bg-[#F39C6B] hover:bg-[#ef8a50] text-[#1c130f] font-extrabold text-xl"
          >
            Search
          </button>
        </div>
      </div>
    </main>
  );
}
