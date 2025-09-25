"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Client = {
  id: string;
  fullName: string;
  accessCode: string;
};

export default function RegisterClientPage() {
  const [fullName, setFullName] = useState("");
  const [accessCode, setAccessCode] = useState("");
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const stored: Client[] = JSON.parse(
      localStorage.getItem("clients") || "[]"
    );

    const newClient: Client = {
      id: Date.now().toString(),
      fullName,
      accessCode,
    };

    localStorage.setItem("clients", JSON.stringify([...stored, newClient]));

    setFullName("");
    setAccessCode("");

    router.push("/dashboard");
  };

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="bg-[#fff4e6] rounded-2xl shadow-md w-full max-w-lg border border-[#3d0000]/20">
        {/* Maroon header */}
        <h1 className="text-xl font-semibold px-6 py-4 bg-[#3d0000] text-white rounded-t-2xl">
          Register Client with Access Code
        </h1>

        <form onSubmit={handleSubmit} className="p-6 space-y-5 text-black">
          <div>
            <label className="block mb-1 font-medium">Client Full Name</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              className="w-full px-3 py-2 border rounded-md"
            />
          </div>

          <div>
            <label className="block mb-1 font-medium">Client Access Code</label>
            <input
              type="text"
              value={accessCode}
              onChange={(e) => setAccessCode(e.target.value)}
              required
              className="w-full px-3 py-2 border rounded-md"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => router.push("/dashboard")}
              className="px-4 py-2 rounded-md border hover:bg-gray-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-md bg-[#e07a5f] text-white font-semibold hover:bg-[#d06950]"
            >
              Register
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
