"use client";

export const dynamic = "force-dynamic";

import Image from "next/image";
import { useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";

type Carer = { id: string; name: string };

function loadCarers(): Carer[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem("carers") || "[]") as Carer[];
  } catch {
    return [];
  }
}

export default function AssignCarerPage() {
  const router = useRouter();
  const params = useSearchParams();
  const carerId = params.get("carer") ?? "";

  const carers = useMemo(loadCarers, []);
  const carerName =
    carers.find((c) => c.id === carerId)?.name ?? "Jasmine Cook";

  const onAssign = () => {
    alert(`Assigned ${carerName}`);
    router.push("/carer/search");
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-[#F5CBA7] p-6">
      {/* top-left logo */}
      <Image
        src="/logo-name.png"
        alt="Scheduling of Care"
        width={220}
        height={55}
        priority
        className="fixed top-6 left-8"
      />

      {/* main card */}
      <div className="w-full max-w-xl min-h-[520px] rounded-[22px] border border-[#6b3f2a] bg-[#F7ECD9] shadow relative overflow-hidden">
        {/* brown top bar aligned with card */}
        <div className="w-full px-8 py-4 bg-[#3A0000] text-white text-center rounded-t-[22px] border-b border-black/10">
          <h1 className="text-3xl font-extrabold">Assign Carer</h1>
        </div>

        {/* description */}
        <p className="mt-8 text-lg text-[#1c130f] text-center leading-relaxed max-w-md mx-auto">
          By assigning this carer to the client you are giving this carer
          access to the client’s dashboard
        </p>

        {/* selected row */}
        <p className="mt-10 text-2xl text-[#1c130f] text-center">
          <span className="font-extrabold">Selected Carer:</span>{" "}
          <span className="font-medium">{carerName}</span>
        </p>

        {/* IMPORTANT warning */}
        <div className="mt-8 mx-8 px-6 py-5 bg-rose-300/25 text-black border border-rose-300/50 rounded-lg">
          <span className="font-bold mr-1">IMPORTANT:</span>
          Once assigned, this carer will gain access to the client’s
          profile and related information.
        </div>

        {/* bottom row */}
        <div className="absolute left-0 right-0 bottom-6 px-10 flex items-center justify-end gap-6">
          <button
            onClick={() => router.push("/carer/search")}
            className="text-xl font-medium text-[#1c130f] hover:opacity-80"
          >
            Cancel
          </button>
          <button
            onClick={onAssign}
            className="rounded-full bg-[#F39C6B] hover:bg-[#ef8a50] text-[#1c130f] text-xl font-extrabold px-8 py-2 shadow"
          >
            Assign
          </button>
        </div>
      </div>
    </main>
  );
}
