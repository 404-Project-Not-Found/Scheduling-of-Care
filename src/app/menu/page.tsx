"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";

const palette = {
  bg: "#F3E9D9",
  panelBg: "#F7ECD9",
  border: "#3A0000",
  text: "#2b2b2b",
  muted: "#666666",
  white: "#FFFFFF",
  accent: "#FF5C5C",
};

export default function MenuPage() {
  const [open, setOpen] = useState(false);
  const firstItemRef = useRef<HTMLAnchorElement | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    if (open) document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  useEffect(() => {
    if (open && firstItemRef.current) firstItemRef.current.focus();
  }, [open]);

  function onBackdropClick(e: React.MouseEvent<HTMLDivElement>) {
    if (e.target === e.currentTarget) setOpen(false);
  }

  return (
    <div className="relative min-h-screen" style={{ backgroundColor: palette.bg }}>
      <button
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls="menu-drawer"
        onClick={() => setOpen(true)}
        className="fixed top-4 left-4 z-40 p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2"
        style={{ color: palette.border }}
        aria-label="Open menu"
      >
        <HamburgerIcon size={32} />
      </button>

      {/* centered message */}
      <div className="min-h-screen flex items-center justify-center">
        <h1
          className="text-2xl md:text-3xl font-semibold tracking-wide"
          style={{ color: palette.border }}
        >
          Dashboard is coming soon
        </h1>
      </div>

      {open && (
        <div
          onClick={onBackdropClick}
          className="fixed inset-0 z-30 bg-black/30"
          aria-hidden="true"
        />
      )}

      <div
        id="menu-drawer"
        role="dialog"
        aria-modal="true"
        aria-label="Menu"
        className={`fixed left-0 top-0 z-40 h-full w-[300px] max-w-[85vw] transform transition-transform duration-200 ease-out
          ${open ? "translate-x-0" : "-translate-x-full"}`}
        style={{
          backgroundColor: palette.panelBg,
          borderRight: `3px solid ${palette.border}`,
        }}
      >
        <div
          className="flex items-center justify-between px-4 py-3"
          style={{ backgroundColor: palette.border, color: palette.white }}
        >
          <div className="flex items-center gap-3">
            <HamburgerIcon size={24} color={palette.white} />
            <h2 className="text-lg font-semibold">Menu</h2>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="rounded px-2 py-1 text-lg hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2"
            aria-label="Close menu"
          >
            ✕
          </button>
        </div>

        <nav className="flex h-[calc(100%-56px)] flex-col justify-between">
          <ul className="px-2 py-3 space-y-2">
            <MenuItem refLink={firstItemRef} href="/update_details" label="Update your details" />
            <MenuItem href="#" label="Request to change a task" />
            <MenuItem href="#" label="Manage organisation access to client" />
            <MenuItem href="#" label="List of clients" />
          </ul>

          <div className="px-4 pb-6 flex justify-end pr-6">
            <Link
              href="#"
              className="underline underline-offset-4 focus:outline-none focus:ring-2 rounded text-lg"
              style={{ color: palette.border }}
            >
              Sign out
            </Link>
          </div>
        </nav>
      </div>
    </div>
  );
}

function HamburgerIcon({ size = 24, color = "currentColor" }: { size?: number; color?: string }) {
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
    >
      <path d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  );
}

type ItemProps = {
  href: string;
  label: string;
  refLink?: React.Ref<HTMLAnchorElement>;
};

function MenuItem({ href, label, refLink }: ItemProps) {
  return (
    <li>
      <Link
        ref={refLink}
        href={href}
        className="block rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-offset-2"
        style={{ color: palette.text }}
      >
        <div className="flex items-center gap-3">
          <span
            aria-hidden="true"
            className="inline-block h-3 w-3 rounded-full"
            style={{ backgroundColor: palette.accent }}
          />
          <div className="text-lg font-medium">{label}</div>
        </div>
      </Link>
    </li>
  );
}
