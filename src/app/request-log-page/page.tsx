// src/app/request-log/page.tsx
// Author: Devni Wijesinghe
"use client";

import { useState } from "react";

type Request = {
  task: string;
  change: string;
  requestedBy: "John (Family)" | "Mary (POA)";
  dateRequested: string; 
  status: "Pending" | "Approved";
  resolutionDate: string;
};

const initialRequests: Request[] = [
  { task: "Replace Toothbrush Head", change: "Change frequency to every 2 months", requestedBy: "John (Family)", dateRequested: "28th June 2025", status: "Pending", resolutionDate: "-" },
  { task: "Dental Appointments", change: "Add an oral cancer screening appointment on the 6th June 2025", requestedBy: "Mary (POA)", dateRequested: "19th May 2025", status: "Approved", resolutionDate: "25th May 2025" },
  { task: "Daily Medication", change: "Add Vitamin D supplement in mornings", requestedBy: "John (Family)", dateRequested: "10th May 2025", status: "Pending", resolutionDate: "-" },
  { task: "Dietary Plan", change: "Reduce sugar intake and add more vegetables", requestedBy: "Mary (POA)", dateRequested: "5th May 2025", status: "Approved", resolutionDate: "12th May 2025" },
  { task: "Exercise Schedule", change: "Add yoga sessions twice weekly", requestedBy: "John (Family)", dateRequested: "1st May 2025", status: "Pending", resolutionDate: "-" },
];

// Convert to Date object
const parseDateString = (dateStr: string) => {
  if (dateStr === "-") return new Date(0);
  const cleanStr = dateStr.replace(/(\d+)(st|nd|rd|th)/, "$1");
  return new Date(cleanStr);
};

export default function RequestLogPage() {
  const [requests] = useState<Request[]>(initialRequests);
  const [search, setSearch] = useState<string>("");
  const [sortKey, setSortKey] = useState<keyof Request | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const filteredRequests = requests.filter((req) =>
    Object.values(req).some((val) =>
      val.toLowerCase().includes(search.toLowerCase())
    )
  );

  const sortedRequests = [...filteredRequests].sort((a, b) => {
    if (!sortKey) return 0;

    let valA: string | number;
    let valB: string | number;

    if (sortKey === "dateRequested" || sortKey === "resolutionDate") {
      valA = parseDateString(a[sortKey]).getTime();
      valB = parseDateString(b[sortKey]).getTime();
    } else {
      valA = a[sortKey].toString().toLowerCase();
      valB = b[sortKey].toString().toLowerCase();
    }

    if (valA < valB) return sortDir === "asc" ? -1 : 1;
    if (valA > valB) return sortDir === "asc" ? 1 : -1;
    return 0;
  });

  const toggleSort = (key: keyof Request) => {
    if (sortKey === key) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  return (
    <>
      <div className="min-h-screen bg-[#ffd9b3] flex flex-col items-center p-6">
        {/* Header */}
        <div className="w-full max-w-6xl flex justify-between items-center bg-[#5a0f0f] text-white px-4 py-3 rounded-t-2xl shadow">
          <h1 className="text-xl font-bold">Request Log</h1>
          <div className="flex items-center gap-2 bg-white rounded-lg px-2 py-1">
            <span className="text-gray-500">🔍</span>
            <input
              type="text"
              placeholder="Search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="border-none focus:outline-none w-40 text-black text-sm"
            />
          </div>
        </div>

        {/* Notification banner */}
        <div className="w-full max-w-6xl bg-[#ff9999] text-[#5a0f0f] px-4 py-2 text-sm font-medium mt-2">
          You requested a change on the 28th June 2025
        </div>

        {/* Requests Table */}
        <div className="w-full max-w-6xl bg-[#fff4e6] rounded-b-2xl shadow-lg overflow-hidden mt-2">
          <div className="overflow-y-auto max-h-[400px]">
            <table className="w-full border-collapse text-sm text-black">
              <thead className="sticky top-0 bg-white shadow-sm">
                <tr className="text-left">
                  <th className="p-3 cursor-pointer whitespace-nowrap" onClick={() => toggleSort("task")}>
                    Task {sortKey === "task" ? (sortDir === "asc" ? "⬆" : "⬇") : "⬍"}
                  </th>
                  <th className="p-3 whitespace-nowrap">Requested Change</th>
                  <th className="p-3 cursor-pointer whitespace-nowrap" onClick={() => toggleSort("requestedBy")}>
                    Requested By {sortKey === "requestedBy" ? (sortDir === "asc" ? "⬆" : "⬇") : "⬍"}
                  </th>
                  <th className="p-3 cursor-pointer whitespace-nowrap" onClick={() => toggleSort("dateRequested")}>
                    Date Requested {sortKey === "dateRequested" ? (sortDir === "asc" ? "⬆" : "⬇") : "⬍"}
                  </th>
                  <th className="p-3 cursor-pointer whitespace-nowrap" onClick={() => toggleSort("status")}>
                    Status {sortKey === "status" ? (sortDir === "asc" ? "⬆" : "⬇") : "⬍"}
                  </th>
                  <th className="p-3 whitespace-nowrap">Resolution Date</th>
                </tr>
              </thead>
              <tbody>
                {sortedRequests.length > 0 ? (
                  sortedRequests.map((req, idx) => (
                    <tr key={idx} className="border-b hover:bg-[#ffeedd] transition">
                      <td className="p-3 font-medium">{req.task}</td>
                      <td className="p-3">{req.change}</td>
                      <td className="p-3">{req.requestedBy}</td>
                      <td className="p-3">{req.dateRequested}</td>
                      <td className="p-3">
                        {req.status === "Pending" ? (
                          <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full text-xs font-semibold">Pending</span>
                        ) : (
                          <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-semibold">Approved</span>
                        )}
                      </td>
                      <td className="p-3">{req.resolutionDate}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="p-6 text-center text-gray-500">No matching requests found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Help Button */}
      <div className="fixed bottom-6 right-6 group">
        <button className="bg-[#ff9999] text-white w-12 h-12 rounded-full shadow-lg text-lg flex items-center justify-center">?</button>
        <div className="absolute bottom-14 right-0 w-64 bg-white text-black text-sm rounded-lg shadow-lg p-3 opacity-0 group-hover:opacity-100 transition">
          <h2 className="font-bold mb-1">Help</h2>
          <p className="text-gray-600 text-xs">
            - Use the search box to filter requests.
            <br />- Click table headers to sort ascending/descending.
            <br />- Status badges show pending/approved.
          </p>
        </div>
      </div>
    </>
  );
}
