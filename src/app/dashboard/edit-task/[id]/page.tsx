"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";

type Unit = "day" | "week" | "month" | "year";

type CareItem = {
  id: string;
  name: string;
  frequencyValue: number;
  frequencyUnit: Unit;
  startDate: string;
  category: string;
  repeatYearly: boolean;
};

export default function EditTaskDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [item, setItem] = useState<CareItem | null>(null);
  const [status, setStatus] = useState<"Pending" | "Completed">("Pending");
  const isStatic = useMemo(() => String(id).startsWith("static-"), [id]);

  useEffect(() => {
    if (isStatic) return;
    const stored: CareItem[] = JSON.parse(
      localStorage.getItem("careItems") || "[]"
    );
    const found = stored.find((x) => x.id === id) || null;
    setItem(found);
  }, [id, isStatic]);

  if (!item) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-[#F7ECD9] p-6">
        <div className="text-gray-600">Loading</div>
      </main>
    );
  }

  const setField = <K extends keyof CareItem>(k: K, v: CareItem[K]) =>
    setItem((prev) => (prev ? { ...prev, [k]: v } : prev));

  const onSave = () => {
    const list: CareItem[] = JSON.parse(
      localStorage.getItem("careItems") || "[]"
    );
    const idx = list.findIndex((x) => x.id === item.id);
    if (idx >= 0) {
      list[idx] = item;
      localStorage.setItem("careItems", JSON.stringify(list));
    }
    router.push("/dashboard");
  };

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="bg-[#fff4e6] rounded-2xl shadow-md w-full max-w-xl">
        {/* Maroon header */}
        <h1 className="text-xl font-semibold px-6 py-7 bg-[#3d0000] text-white rounded-t-2xl">
          Edit task
        </h1>

        {/* Task title below header */}
        <div className="py-5">
          <p className="font-bold text-black text-center">{item.name}</p>
        </div>

        <div className="p-4 space-y-5 text-black">
          {/* Frequency */}
          <div>
            <label className="block mb-1 font-medium">Frequency:</label>
            <div className="flex gap-3">
              <input
                type="number"
                min={1}
                value={item.frequencyValue ?? 1}
                onChange={(e) =>
                  setField("frequencyValue", Number(e.target.value))
                }
                className="w-24 px-3 py-2 border rounded-md"
              />
              <select
                value={item.frequencyUnit ?? "month"}
                onChange={(e) =>
                  setField(
                    "frequencyUnit",
                    e.target.value as CareItem["frequencyUnit"]
                  )
                }
                className="px-3 py-2 border rounded-md"
              >
                <option value="day">Day</option>
                <option value="week">Week</option>
                <option value="month">Month</option>
                <option value="year">Year</option>
              </select>
            </div>
          </div>

          {/* Last done */}
          <div>
            <label className="block mb-1 font-medium">Last done:</label>
            <input
              type="date"
              value={item.startDate ? item.startDate.slice(0, 10) : ""}
              onChange={(e) => setField("startDate", e.target.value)}
              className="w-full px-3 py-2 border rounded-md"
            />
          </div>

          {/* Status */}
          <div>
            <label className="block mb-1 font-medium">Status:</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as typeof status)}
              className="px-3 py-2 border rounded-md"
            >
              <option>Pending</option>
              <option>Completed</option>
            </select>
          </div>

          {/* Category */}
          <div>
            <label className="block mb-1 font-medium">Category:</label>
            <input
              type="text"
              value={item.category ?? ""}
              onChange={(e) => setField("category", e.target.value)}
              className="w-full px-3 py-2 border rounded-md"
            />
          </div>

          {/* Note */}
          <div className="rounded-md border p-3 text-sm text-gray-700 bg-gray-50">
            Editing frequency and dates will change the schedule of this care
            item for the rest of the year. Be aware of any budget implications
            caused by this change. Make this change?
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              className="px-4 py-2 rounded-md border hover:bg-gray-100"
              onClick={() => router.push("/dashboard/edit-task")}
            >
              Cancel
            </button>
            <button
              className="px-4 py-2 rounded-md bg-[#E07A5F] text-white font-semibold hover:bg-[#d06950]"
              onClick={onSave}
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
