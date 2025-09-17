// src/app/menu/page.tsx
"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";

const palette = {
  pageBg: "#ffd9b3",      // page background
  cardBg: "#FAEBDC",     // dashboard inner background
  header: "#4A0A0A",     // dark brown
  banner: "#F9C9B1",     // notice banner
  border: "#4A0A0A",     // card border
  panelBg: "#F7ECD9",    // drawer background
  text: "#2b2b2b",
  white: "#FFFFFF",
};

export default function MenuPage() {
  const [open, setOpen] = useState(false);

  // Close drawer with ESC
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    if (open) document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  // Backdrop click to close
  function onBackdropClick(e: React.MouseEvent<HTMLDivElement>) {
    if (e.target === e.currentTarget) setOpen(false);
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center px-6 py-10 relative"
         style={{ backgroundColor: "#ffd9b3" }}>

      {/* ===== Dashboard Card (centered) ===== */}
      <div className="w-full max-w-5xl">
        {/* Top bar inside the card */}
        <div className="rounded-t-3xl px-6 py-5 flex items-center gap-4"
             style={{ backgroundColor: palette.header, color: palette.white }}>
          {/* Round hamburger triggers the drawer */}
          <button
            aria-label="Open menu"
            onClick={() => setOpen(true)}
            className="h-11 w-11 rounded-full bg-white flex items-center justify-center shrink-0"
          >
            <HamburgerIcon size={22} color={palette.header} />
          </button>

          {/* Title + small logo mark */}
          <div className="flex items-center gap-3">
            <h1 className="text-2xl md:text-3xl font-bold">Dashboard</h1>
            {/* You can swap to a smaller mark if you have one */}
            <Image
              src="/logo-name.png"
              alt="Scheduling of Care"
              width={120}
              height={32}
              className="object-contain"
              priority
            />
          </div>
        </div>

        {/* Framed content area */}
        <div className="rounded-b-3xl overflow-hidden border-4"
             style={{ borderColor: palette.border, backgroundColor: palette.cardBg }}>
          {/* Notice banner */}
          <div className="w-full border-b px-6 py-3 flex items-center gap-3"
               style={{ backgroundColor: palette.banner, borderColor: "#e2b197" }}>
            <BellIcon />
            <p className="text-base text-[#4A0A0A]">
              Select a client from list of clients under the menu options to view their tasks
            </p>
          </div>

          {/* Empty body area */}
          <div className="h-[420px]" />
        </div>
      </div>

      {/* ===== Drawer Backdrop ===== */}
      {open && (
        <div
          onClick={onBackdropClick}
          className="fixed inset-0 z-30 bg-black/30"
          aria-hidden="true"
        />
      )}

      {/* ===== Drawer Panel ===== */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Menu"
        className={`fixed left-0 top-0 z-40 h-full w-[300px] max-w-[85vw] transform transition-transform duration-200 ease-out
          ${open ? "translate-x-0" : "-translate-x-full"}`}
        style={{
          backgroundColor: palette.panelBg,
          borderRight: `3px solid ${palette.header}`,
        }}
      >
        {/* Drawer header */}
        <div className="flex items-center justify-between px-4 py-3"
             style={{ backgroundColor: palette.header, color: palette.white }}>
          <div className="flex items-center gap-3">
            <HamburgerIcon size={22} color={palette.white} />
            <h2 className="text-lg font-semibold">Menu</h2>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="rounded px-2 py-1 text-lg hover:opacity-90 focus:outline-none"
            aria-label="Close menu"
          >
            ✕
          </button>
        </div>

        {/* Drawer body */}
        <nav className="flex h-[calc(100%-56px)] flex-col justify-between">
          <ul className="px-3 py-4 space-y-2">
            <MenuItem href="/update_details" label="Update your details" />
            <MenuItem href="/request_of_change_page" label="Request to change a task" />
            <MenuItem href="/manage-access-code-page" label="Manage organisation access to client" />
            <MenuItem href="/clients_list" label="Manage your Client" />
          </ul>

          <div className="px-4 pb-6 flex justify-end pr-6">
            <Link
              href="#"
              className="underline underline-offset-4 focus:outline-none rounded text-lg"
              style={{ color: palette.header }}
            >
              Sign out
            </Link>
          </div>
        </nav>
      </div>
    </div>
  );
}

/* ================= Helpers ================= */

function HamburgerIcon({
  size = 24,
  color = "currentColor",
}: {
  size?: number;
  color?: string;
}) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  );
}

function BellIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="currentColor"
      className="text-[#4A0A0A]"
      aria-hidden="true"
    >
      <path d="M12 2a6 6 0 00-6 6v3.586l-1.707 1.707A1 1 0 005 15h14a1 1 0 00.707-1.707L18 11.586V8a6 6 0 00-6-6zm0 20a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
    </svg>
  );
}

function MenuItem({ href, label }: { href: string; label: string }) {
  return (
    <li>
      <Link
        href={href}
        className="block rounded-xl px-4 py-3 transition-colors outline-none
                   hover:bg-[#EADBC4] focus-visible:bg-[#EADBC4] active:bg-[#E1D0B5]"
        style={{ color: palette.text }}
      >
        <div className="flex items-center gap-3">
          <span
            aria-hidden="true"
            className="inline-block h-3 w-3 rounded-full"
            style={{ backgroundColor: "#FF5C5C" }}
          />
          <div className="text-lg font-medium">{label}</div>
        </div>
      </Link>
    </li>
  );
}
