"use client";

import React, { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";

type OrgStatus = "active" | "pending" | "revoked";
interface Organization {
  id: string;
  name: string;
  status: OrgStatus;
}

export default function ManageAccessPage() {
  const router = useRouter();

  const [orgs, setOrgs] = useState<Organization[]>([
    { id: "1", name: "SunnyCare Facility", status: "active" },
    { id: "2", name: "Haven Care Centre", status: "pending" },
    { id: "3", name: "Rosehill Aged Care", status: "revoked" },
    { id: "4", name: "Maple Leaf Aged Care", status: "active" },
    { id: "5", name: "Cedar Grove Home", status: "pending" },
    { id: "6", name: "Lakeside Care", status: "active" },
    { id: "7", name: "Willow Creek Home", status: "revoked" },
    { id: "8", name: "Pine Valley Facility", status: "pending" },
    { id: "9", name: "Oakwood Seniors", status: "active" },
  ]);

  function revokeOrg(id: string) {
    setOrgs((prev) => prev.map((o) => (o.id === id ? { ...o, status: "revoked" } : o)));
  }
  function approveOrg(id: string) {
    setOrgs((prev) => prev.map((o) => (o.id === id ? { ...o, status: "active" } : o)));
  }
  function removePending(id: string) {
    setOrgs((prev) => prev.map((o) => (o.id === id ? { ...o, status: "revoked" } : o)));
  }

  return (
    <div className="min-h-screen w-full bg-[#ffd9b3] relative">
      <div className="absolute top-8 left-8 w-64 h-32">
        <Image
          src="/logo-name.png"
          alt="Scheduling of Care"
          width={256}
          height={128}
          className="object-contain"
          priority
        />
      </div>

      <div className="flex justify-center pt-38">
        <div className="scale-90 origin-top w-full">
          {/* card */}
          <div className="w-full max-w-3xl md:max-w-4xl mx-auto bg-[#F7ECD9] rounded-2xl shadow-lg overflow-hidden">
            {/* header */}
            <div className="bg-[#4A0A0A] px-5 py-5 flex justify-center">
              <h1 className="text-3xl font-bold text-white text-center">Manage Access Codes</h1>
            </div>

            {/* tiny gap */}
            <div className="h-3" />

            {/* privacy notice */}
            <div className="px-5 py-2 bg-[#ff9999]/40">
                <p className="text-base font-semibold text-black/90">
                    Privacy Notice: This information is visible only to you and will not be shared with anyone.
                </p>
            </div>

            {/* organisations list */}
            <div className="p-5 bg-white mx-5 mt-5 mb-3 rounded border shadow-sm max-h-[320px] overflow-y-auto text-black">
              <Group
                title="Organisations with Access"
                items={orgs.filter((o) => o.status === "active")}
                onRevoke={revokeOrg}
              />
              <hr className="my-4" />
              <Group
                title="Organisations with Access Pending"
                items={orgs.filter((o) => o.status === "pending")}
                onApprove={approveOrg}
                onRemove={removePending}
              />
              <hr className="my-4" />
              <Group title="Revoked Organisations" items={orgs.filter((o) => o.status === "revoked")} />
            </div>

            {/* Save & Return */}
            <div className="flex justify-center pt-2 pb-6">
              <button
                className="bg-[#4A0A0A] text-white font-semibold px-8 py-3 rounded-md hover:bg-[#3a0808] transition-colors"
                onClick={() => router.push("/menu")}
              >
                Save &amp; Return
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="fixed bottom-6 right-6 transform scale-90 origin-bottom-right">
        <div className="relative">
          <div
            className="w-12 h-12 bg-[#ff9900] text-white rounded-full flex items-center justify-center font-bold text-xl cursor-pointer"
            onMouseEnter={(e) => e.currentTarget.nextElementSibling?.classList.remove("hidden")}
            onMouseLeave={(e) => e.currentTarget.nextElementSibling?.classList.add("hidden")}
            aria-label="Help"
            title="Help"
          >
            ?
          </div>
          <div className="hidden absolute bottom-16 right-0 w-80 bg-white border border-gray-300 p-4 rounded shadow-lg text-sm z-50 text-black">
            <h4 className="font-semibold mb-2">How to use this page</h4>
            <ul className="list-disc pl-5 space-y-1">
              <li>View all organisations and their access status.</li>
              <li>Approve pending organisations or revoke access as needed.</li>
              <li>
                Click <b>Save &amp; Return</b> to confirm changes.
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

/* group component for orgs */
function Group({
  title,
  items,
  onRevoke,
  onRemove,
  onApprove,
}: {
  title: string;
  items: Organization[];
  onRevoke?: (id: string) => void;
  onRemove?: (id: string) => void;
  onApprove?: (id: string) => void;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <div className="font-semibold text-base">{title}</div>
      </div>

      <div className="space-y-2 text-base text-black">
        {items.length === 0 && <div className="text-slate-500">None</div>}
        {items.map((item) => (
          <div key={item.id} className="flex items-center justify-between">
            <div>{item.name}</div>
            <div className="flex items-center gap-3">
              {item.status === "active" && onRevoke && (
                <button onClick={() => onRevoke(item.id)} className="text-base underline cursor-pointer">
                  Revoke
                </button>
              )}
              {item.status === "pending" && (
                <>
                  {onApprove && (
                    <button
                      onClick={() => onApprove(item.id)}
                      className="text-base underline cursor-pointer"
                      title="Approve"
                    >
                      ✔
                    </button>
                  )}
                  {onRemove && (
                    <button
                      onClick={() => onRemove(item.id)}
                      className="text-base underline cursor-pointer"
                      title="Remove"
                    >
                      ✖
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
