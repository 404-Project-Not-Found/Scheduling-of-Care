"use client";

import Badge from "@/components/ui/Badge";

export type CostRow = {
  id: string;
  item: string;
  category: string;
  allocated: number;
  spent: number;
  status: "Exceeded" | "Nearly Exceeded" | "Within Limit";
};

type Props = {
  items: CostRow[];
  year: string;
};

function remaining(allocated: number, spent: number) {
  return allocated - spent; // negative means overspent
}

export default function OverspentTable({ items, year }: Props) {
  const overs = items.filter((i) => i.status === "Exceeded");
  return (
    <div className="rounded-xl border border-black/10 bg-white text-black">
      <div className="px-4 py-3 border-b bg-[#fff8f0] flex items-center justify-between">
        <div className="font-semibold">Overspent Items: {overs.length}</div>
        <div className="text-sm text-black">Year: {year}</div>
      </div>

      <div>
        <table className="w-full text-left text-sm divide-y">
          <thead className="text-gray-600">
            <tr className="text-black">
              <th className="px-4 py-3">Item</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Allocated Budget</th>
              <th className="px-4 py-3">Amount Spent</th>
              <th className="px-4 py-3">Remaining</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {items.map((r) => {
              const rem = remaining(r.allocated, r.spent);
              const tone =
                r.status === "Exceeded" ? "red" : r.status === "Nearly Exceeded" ? "yellow" : "green";
              return (
                <tr key={r.id} className="text-black">
                  <td className="px-4 py-3">{r.item}</td>
                  <td className="px-4 py-3">{r.category}</td>
                  <td className="px-4 py-3">${r.allocated}</td>
                  <td className="px-4 py-3">${r.spent}</td>
                  <td className={`px-4 py-3 ${rem < 0 ? "text-red-600" : ""}`}>
                    {rem < 0 ? "-" : ""}${Math.abs(rem)}
                  </td>
                  <td className="px-4 py-3">
                    <Badge tone={tone as any}>{r.status}</Badge>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
