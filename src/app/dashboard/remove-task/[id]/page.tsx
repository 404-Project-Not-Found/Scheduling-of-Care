"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { format } from "date-fns";
import Image from "next/image";

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

const colors = {
  pageBg: "#ffd9b3", // page background
  cardBg: "#F7ECD9", // card background
  header: "#3A0000", // maroon header
  text: "#2b2b2b",
  orange: "#F4A261", // action button
};

export default function RemoveTaskDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [item, setItem] = useState<CareItem | null>(null);

  // Load selected item
  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored: CareItem[] = JSON.parse(
      localStorage.getItem("careItems") || "[]"
    );
    setItem(stored.find((x) => x.id === id) || null);
  }, [id]);

  if (!item) {
    return (
      <main
        className="min-h-screen flex items-center justify-center p-6"
        style={{ backgroundColor: colors.pageBg }}
      >
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
    <main
      className="min-h-screen w-full flex items-center justify-center px-6 py-12 relative"
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

      {/* Card */}
      <div
        className="w-full max-w-2xl rounded-2xl shadow-lg overflow-hidden border"
        style={{ backgroundColor: colors.cardBg, borderColor: "#e7d8c4" }}
      >
        {/* Maroon header */}
        <div
          className="w-full flex items-center justify-center px-6 py-5"
          style={{ backgroundColor: colors.header }}
        >
          <h1 className="text-2xl md:text-3xl font-bold text-white text-center">
            Remove task
          </h1>
        </div>

        {/* Body */}
        <div className="px-6 md:px-8 py-6 md:py-8 text-black">
          {/* Title */}
          <p
            className="font-bold text-center text-lg mb-4"
            style={{ color: colors.text }}
          >
            {item.name}
          </p>

          {/* Details */}
          <div className="space-y-3 text-sm">
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

          {/* Notice box */}
          <div className="rounded-md border p-3 text-sm text-gray-700 bg-gray-50 mt-5">
            Removing this care item will change the schedule of this care item
            for the rest of the year. Be aware of any budget implications caused
            by this change. Proceed?
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-4 pt-6">
            <button
              className="px-6 py-2.5 rounded-full border text-gray-700 hover:bg-gray-200"
              onClick={() => router.push("/dashboard/remove-task")}
            >
              Cancel
            </button>
            <button
              className="px-7 py-2.5 rounded-full font-semibold border"
              style={{
                backgroundColor: colors.orange,
                borderColor: "#F39C6B]",
                color: "black",
              }}
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
