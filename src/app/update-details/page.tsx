"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function UpdateDetailsPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Updated:", { email, password });
    alert("Details updated!");
  };

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="bg-[#fff4e6] rounded-2xl shadow-md w-full max-w-md border">
        <h1 className="text-xl text-black font-semibold px-6 py-2">
          Update your details
        </h1>

        <form onSubmit={handleSubmit} className="p-6 text-black space-y-4">
          <div>
            <label className="block mb-1 font-medium">Change email:</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter new email"
              className="w-full px-3 py-2 border rounded-md"
            />
          </div>

          <div>
            <label className="block mb-1 font-medium">Change password:</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter new password"
              className="w-full px-3 py-2 border rounded-md"
            />
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
              className="px-4 py-2 rounded-md bg-[#f6a56f] text-black font-semibold hover:bg-[#d06950]"
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
