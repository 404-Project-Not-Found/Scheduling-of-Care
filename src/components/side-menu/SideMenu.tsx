"use client";

import Link from "next/link";

type Item = { href: string; label: string };

type SideMenuProps = {
  open: boolean;
  onClose: () => void;
  items?: Item[];
};

const defaultItems: Item[] = [
  { href: "/update_details", label: "Update your details" },

  { href: "/dashboard/add-care-items", label: "Add Care Item" },
  { href: "/dashboard/edit-task", label: "Edit Task" },

  { href: "/dashboard/remove-task", label: "Remove Task" },
  { href: "/carer/search", label: "Assign Carer" },

  { href: "/dashboard/register-client", label: "Register new client" },
  { href: "/dashboard/client-list", label: "List of clients" },
];

export default function SideMenu({
  open,
  onClose,
  items = defaultItems,
}: SideMenuProps) {
  return (
    <>
      {/* Backdrop */}
      <div
        aria-hidden
        onClick={onClose}
        className={`fixed inset-0 z-40 bg-black/40 transition-opacity
          ${
            open
              ? "opacity-100 pointer-events-auto"
              : "opacity-0 pointer-events-none"
          }`}
      />

      {/* Sliding drawer */}
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Side menu"
        className={`fixed left-0 top-0 z-50 h-full w-72 bg-[#f7ecd9] text-black shadow-xl
          transform transition-transform duration-300
          ${open ? "translate-x-0" : "-translate-x-full"}`}
      >
        {/* Maroon header only */}
        <div className="bg-[#3d0000] text-white p-4 flex items-center justify-between">
          <span className="font-semibold">Menu</span>
          <button
            onClick={onClose}
            className="h-8 w-8 rounded-full bg-white/10 leading-none"
            aria-label="Close menu"
            title="Close"
          >
            ×
          </button>
        </div>

        <nav className="p-2 space-y-1">
          {items.map((it) => (
            <Link
              key={it.href}
              href={it.href}
              onClick={onClose}
              className="block px-4 py-3 rounded-lg hover:bg-black/10"
            >
              {it.label}
            </Link>
          ))}
        </nav>
      </aside>
    </>
  );
}
