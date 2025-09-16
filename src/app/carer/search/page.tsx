"use client";

export const dynamic = "force-dynamic";

import Image from "next/image";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Carer = {
  id: string;
  name: string;
  deleted?: boolean;
  hasAccess?: boolean;
};

// seed localStorage (since no backend yet)
function ensureSeed() {
  if (typeof window === "undefined") return;
  const raw = localStorage.getItem("carers");
  if (!raw) {
    localStorage.setItem(
      "carers",
      JSON.stringify([
        { id: "jasmine-cook", name: "Jasmine Cook", deleted: false, hasAccess: false },
        { id: "john-smith",   name: "John Smith",   deleted: false, hasAccess: true  }, 
      ])
    );
    return;
  }

  try {
    const list: Carer[] = JSON.parse(raw) as Carer[];
    const byId = new Map<string, Carer>(list.map((c) => [c.id, c]));
    if (!byId.has("jasmine-cook")) {
      list.push({ id: "jasmine-cook", name: "Jasmine Cook", deleted: false, hasAccess: false });
    }
    if (!byId.has("john-smith")) {
      list.push({ id: "john-smith", name: "John Smith", deleted: false, hasAccess: true });
    } else {
      const john = list.find((c) => c.id === "john-smith");
      if (john) john.hasAccess = true;
    }
    for (const c of list) {
      if (typeof c.hasAccess !== "boolean") c.hasAccess = false;
      if (typeof c.deleted !== "boolean") c.deleted = false;
    }
    localStorage.setItem("carers", JSON.stringify(list));
  } catch {
    localStorage.setItem(
      "carers",
      JSON.stringify([
        { id: "jasmine-cook", name: "Jasmine Cook", deleted: false, hasAccess: false },
        { id: "john-smith",   name: "John Smith",   deleted: false, hasAccess: true  },
      ])
    );
  }
}

function loadCarers(): Carer[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem("carers") || "[]") as Carer[];
  } catch {
    return [];
  }
}

export default function SearchCarerPage() {
  const router = useRouter();

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Carer[]>([]);
  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    ensureSeed();
  }, []);

  const runSearch = () => {
    const source = loadCarers();           
    const q = query.trim().toLowerCase();
    const hits =
      q.length === 0
        ? []
        : source.filter((c) => !c.deleted && c.name.toLowerCase().includes(q));
    setResults(hits);
    setHasSearched(true);
  };

  const pick = (c: Carer) => {
    const path = c.hasAccess ? "/carer/revoke" : "/carer/assign";
    router.push(`${path}?carer=${encodeURIComponent(c.id)}`);
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-[#F5CBA7] p-6">
      {/* top-left logo */}
      <Image
        src="/logo-name.png"
        alt="Scheduling of Care"
        width={220}
        height={55}
        priority
        className="fixed top-6 left-8"
      />

      {/* narrow card */}
      <div className="w-full max-w-xl min-h-[500px] rounded-[22px] border border-[#6b3f2a] bg-[#F7ECD9] p-8 pb-10 shadow relative">
        <div className="-mx-8 -mt-8 px-8 py-4 bg-[#3A0000] text-white rounded-t-[22px] border-b border-black/10 text-center">
          <h1 className="text-3xl font-extrabold">Manage Carer Access</h1>
        </div>

        <h2 className="mt-6 text-2xl font-bold text-[#1c130f]">Search & Select</h2>

        {/* search input + button */}
        <div className="mt-6 flex items-start gap-3">
          <div className="flex-1 rounded-2xl border border-[#7c5040] bg-white shadow-sm overflow-hidden">
            {/* input row */}
            <div className="px-5 py-4">
              <div className="flex items-center gap-3">
                <svg viewBox="0 0 24 24" className="w-7 h-7 text-gray-600" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="7" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                <input
                  placeholder="Search for carer to assign"
                  value={query}
                  onChange={(e) => {
                    const v = e.target.value;
                    setQuery(v);
                    if (v.trim() === "") {
                      setResults([]);
                      setHasSearched(false);
                    }
                  }}
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
                  {results.map((c) => (
                    <li key={c.id}>
                      <button
                        role="option"
                        onClick={() => pick(c)}
                        className="w-full text-left px-5 py-3 text-lg text-black hover:bg-gray-300 focus:bg-gray-300 focus:outline-none transition"
                      >
                        {c.name}
                        {c.hasAccess}
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                query.trim() !== "" && <div className="py-3 px-5 text-gray-500">No carers found.</div>
              ))}
          </div>

          {/* search button */}
          <button
            onClick={runSearch}
            className="h-[56px] px-6 rounded-2xl bg-[#F39C6B] hover:bg-[#ef8a50] text-[#1c130f] font-extrabold text-xl"
          >
            Search
          </button>
        </div>

        {/* extra options */}
        <div className="mt-10 flex flex-col gap-4">
          <button className="w-fit rounded-full bg-[#F39C6B] text-[#1c130f] font-bold px-5 py-2 hover:bg-[#ef8a50]">
            Add New Carer
          </button>
        </div>

        {/* help dot */}
        <div className="absolute left-4 bottom-4 w-7 h-7 rounded-full bg-rose-300/80 text-[#3A0000] flex items-center justify-center font-bold">
          ?
        </div>
      </div>
    </main>
  );
}
