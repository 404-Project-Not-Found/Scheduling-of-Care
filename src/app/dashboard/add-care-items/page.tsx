"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Unit = "day" | "week" | "month" | "year";

export default function AddCareItemPage() {
  const [name, setName] = useState("");
  const [frequencyValue, setFrequencyValue] = useState<number>(1);
  const [frequencyUnit, setFrequencyUnit] = useState<Unit>("month");
  const [startDate, setStartDate] = useState("");
  const [category, setCategory] = useState("");
  const [repeatYearly, setRepeatYearly] = useState(false);

  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const existing = JSON.parse(localStorage.getItem("careItems") || "[]");
    const newItem = {
      id: Date.now().toString(),
      name,
      frequencyValue,
      frequencyUnit,
      startDate,
      category,
      repeatYearly,
    };
    localStorage.setItem("careItems", JSON.stringify([...existing, newItem]));

    // Redirect back to dashboard
    router.push("/dashboard");
  };

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="bg-[#fff4e6] rounded-2xl shadow-md w-full max-w-lg border border-[#3d0000]/20">
        <h1 className="text-xl font-semibold px-6 py-4 bg-[#3d0000] text-white rounded-t-2xl">
          Add Care Item
        </h1>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-black">
          <div>
            <label className="block mb-1 font-medium">Name of Care Item:</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border rounded-md"
              required
            />
          </div>

          {/* Frequency field: number input + unit dropdown */}
          <div>
            <label className="block mb-1 font-medium">Frequency:</label>
            <div className="flex gap-3">
              <input
                type="number"
                min={1}
                value={frequencyValue}
                onChange={(e) => setFrequencyValue(Number(e.target.value))}
                className="w-24 px-3 py-2 border rounded-md"
                required
              />

              {/* unit selector */}
              <select
                value={frequencyUnit}
                onChange={(e) => setFrequencyUnit(e.target.value as Unit)}
                className="px-3 py-2 border rounded-md"
              >
                <option value="day">Day</option>
                <option value="week">Week</option>
                <option value="month">Month</option>
                <option value="year">Year</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block mb-1 font-medium">Start Date:</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 border rounded-md"
              required
            />
          </div>

          <div>
            <label className="block mb-1 font-medium">Category:</label>
            <input
              type="text"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 border rounded-md"
              required
            />
          </div>

          <div>
            <label className="block mb-1 font-medium">Repeat Yearly?</label>
            <div className="flex gap-3">
              <button
                type="button"
                className={`px-4 py-2 rounded-md border ${repeatYearly ? "bg-[#3d0000] text-white" : "bg-gray-100"}`}
                onClick={() => setRepeatYearly(true)}
              >
                Yes
              </button>
              <button
                type="button"
                className={`px-4 py-2 rounded-md border ${!repeatYearly ? "bg-[#3d0000] text-white" : "bg-gray-100"}`}
                onClick={() => setRepeatYearly(false)}
              >
                No
              </button>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              className="px-4 py-2 rounded-md border border-gray-300 hover:bg-gray-100"
              onClick={() => router.push("/dashboard")}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-md bg-[#E07A5F] text-white font-semibold hover:bg-[#d06950]"
            >
              Submit
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
