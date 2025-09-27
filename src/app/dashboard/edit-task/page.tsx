"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";

type CareItem = {
  id: string;
  name: string;
  startDate: string;
  category?: string;
  frequencyValue?: number;
  frequencyUnit?: "day" | "week" | "month" | "year";
};

const colors = {
  pageBg: "#ffd9b3", // page background
  cardBg: "#F7ECD9", // card background
  header: "#3A0000", // maroon header
  text: "#2b2b2b",
};

export default function EditTaskSearchPage() {
  const [query, setQuery] = useState("");
  const [careItems, setCareItems] = useState<CareItem[]>([]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored: CareItem[] = JSON.parse(
      localStorage.getItem("careItems") || "[]"
    );
    setCareItems(stored);
  }, []);

  const all = useMemo(
    () => careItems.map((c) => ({ id: c.id, label: c.name })),
    [careItems]
  );

  const filtered = all.filter((t) =>
    t.label.toLowerCase().includes(query.toLowerCase().trim())
  );

  return (
    <main
      className="min-h-screen w-full flex items-start justify-center px-6 pb-12 pt-28 md:pt-36 relative"
      style={{ backgroundColor: colors.pageBg }}
    >
      {/* Top-left logo */}
      <div className="absolute top-6 left-6">
        <Image
          src="/logo-name.png"
          alt="Scheduling of Care"
          width={220}
          height={80}
          className="object-contain"
          priority
        />
      </div>

      {/* Centered card */}
      <div
        className="w-full max-w-2xl rounded-2xl shadow-lg overflow-hidden border"
        style={{ backgroundColor: colors.cardBg, borderColor: "#e7d8c4" }}
      >
        {/* Maroon header with centered title */}
        <div
          className="w-full flex items-center justify-center px-6 py-5"
          style={{ backgroundColor: colors.header }}
        >
          <h1 className="text-2xl md:text-3xl font-bold text-white text-center">
            Edit task
          </h1>
        </div>

        {/* Body */}
        <div className="px-6 md:px-8 py-6 md:py-8 text-black">
          {/* Search */}
          <input
            placeholder="Search for task"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-white border-2 rounded-md px-4 py-3 focus:outline-none focus:ring-2"
            style={{ borderColor: `${colors.header}55` }}
          />

          {/* Results */}
          <div className="mt-4 space-y-3">
            {filtered.map((t) => (
              <Link
                key={t.id}
                href={`/dashboard/edit-task/${t.id}`}
                className="block rounded-xl px-4 py-3 border bg-gray-50 hover:bg-[#EADBC4] active:bg-[#E1D0B5] transition"
                style={{ color: colors.text, borderColor: "#bfb8ad" }}
              >
                {t.label}
              </Link>
            ))}

            {filtered.length === 0 && (
              <p className="text-gray-600">No tasks match your search.</p>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
