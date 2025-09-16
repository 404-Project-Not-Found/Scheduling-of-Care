"use client";

import { useMemo, useState } from "react";
import CostReportsHeader from "@/components/cost/CostReportsHeader";
import YearSelect from "@/components/cost/YearSelect";
import AlertBanner from "@/components/cost/AlertBanner";
import BudgetSummaryGrid from "@/components/cost/BudgetSummaryGrid";
import OverspentTable, { type CostRow } from "@/components/cost/OverspentTable";

const ITEMS: CostRow[] = [
  { id: "1", item: "Dental Appointments", category: "Hygiene", allocated: 600, spent: 636, status: "Exceeded" },
  { id: "2", item: "Toothbrush Heads",  category: "Hygiene", allocated: 30,  spent: 28,  status: "Nearly Exceeded" },
  { id: "3", item: "Socks",             category: "Clothing", allocated: 50,  spent: 36,  status: "Within Limit" },
];

export default function CostReportsPage() {
  const [q, setQ] = useState("");
  const [year, setYear] = useState("2025");

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    return t ? ITEMS.filter(i => i.item.toLowerCase().includes(t)) : ITEMS;
  }, [q]);

  const firstExceeded = filtered.find(i => i.status === "Exceeded");
  const alertMsg = firstExceeded
    ? `${firstExceeded.item} budget exceeded by $${Math.abs(firstExceeded.allocated - firstExceeded.spent)}`
    : undefined;

  const totalAllocated = ITEMS.reduce((s, i) => s + i.allocated, 0);
  const totalSpent = ITEMS.reduce((s, i) => s + i.spent, 0);

  return (
    <main className="min-h-screen">
      <div className="min-h-screen bg-[#FFF4E6]">
        <CostReportsHeader q={q} setQ={setQ} />

        <section className="p-5 p-6">
          <YearSelect year={year} setYear={setYear} />
          <AlertBanner message={alertMsg} />

          <BudgetSummaryGrid
            summary={{
              totalAnnualBudget: totalAllocated,
              spentToDate: totalSpent,
              remainingBalance: totalAllocated - totalSpent,
            }}
          />

          <OverspentTable items={filtered} year={year} />

          <div className="mt-6 flex justify-end gap-3">
            <button className="px-5 rounded-full bg-white text-black border">Export CSV</button>
            <button className="h-10 px-5 rounded-full bg-[#4A0A0A] text-white">Print</button>
          </div>
        </section>
      </div>
    </main>
  );
}
