"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { format } from "date-fns";

type Unit = "day" | "week" | "month" | "year";

type CareItem = {
  id: string;
  name: string;
  frequencyValue?: number;
  frequencyUnit?: Unit;
  startDate: string;
  category?: string;
  repeatYearly?: boolean;
};

export default function RemoveTaskDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [item, setItem] = useState<CareItem | null>(null);

  // Load selected item
  useEffect(() => {
    const stored: CareItem[] = JSON.parse(
      localStorage.getItem("careItems") || "[]"
    );
    setItem(stored.find((x) => x.id === id) || null);
  }, [id]);

  if (!item) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-[#f7ecd9] p-6">
        <div className="text-gray-600">Loading</div>
      </main>
    );
  }

  const onRemove = () => {
    const list: CareItem[] = JSON.parse(
      localStorage.getItem("careItems") || "[]"
    );
    const next = list.filter((x) => x.id !== item.id);
    localStorage.setItem("careItems", JSON.stringify(next));
    router.push("/dashboard");
  };

  const freq =
    item.frequencyValue && item.frequencyUnit
      ? `every ${item.frequencyValue} ${item.frequencyUnit}${
          item.frequencyValue === 1 ? "" : "s"
        }`
      : "—";

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="bg-[#fff4e6] rounded-2xl shadow-md w-full max-w-xl border">
        {/* Maroon header */}
        <h1 className="text-xl font-semibold px-6 py-4 bg-[#3d0000] text-white rounded-t-2xl">
          Remove task
        </h1>

        {/* Title */}
        <div className="px-6 py-3">
          <p className="font-bold text-black text-center">{item.name}</p>
        </div>

        <div className="p-6 space-y-5 text-black">
          <div className="px-0 py-0 space-y-3 text-sm">
            <p>
              <span className="font-medium">Frequency:</span> {freq}
            </p>
            <p>
              <span className="font-medium">Last done:</span>{" "}
              {item.startDate
                ? format(new Date(item.startDate), "do MMMM yyyy")
                : "—"}
            </p>
            <p>
              <span className="font-medium">Category:</span>{" "}
              {item.category || "—"}
            </p>
          </div>

          <div className="rounded-md border p-3 text-sm text-gray-700 bg-gray-50">
            Removing this care item will change the schedule of this care item
            for the rest of the year. Be aware of any budget implications caused
            by this change. Proceed?
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              className="px-4 py-2 rounded-md border hover:bg-gray-100"
              onClick={() => router.push("/dashboard/remove-task")}
            >
              Cancel
            </button>
            <button
              className="px-4 py-2 rounded-md bg-[#e07a5f] text-white font-semibold hover:bg-[#d06950]"
              onClick={onRemove}
            >
              Remove
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
