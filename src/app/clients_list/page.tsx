"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";

const palette = {
  pageBg: "#ffd9b3",
  cardBg: "#F7ECD9",
  header: "#3A0000",
  text: "#2b2b2b",
  border: "#3A0000",
  help: "#ff9999",
  white: "#ffffff",
};

const members = ["Jane Smith", "Harry Dong", "Jose Lin", "Kevin Wu", "Mickey Mouse"];

export default function FamilyPOAListPage() {
  const router = useRouter();

  const goBack = () => {
    router.back();
    // fallback if there's no history
    setTimeout(() => router.push("/menu"), 0);
  };

  return (
    <main
      className="min-h-screen relative flex items-center justify-center p-8"
      style={{ backgroundColor: palette.pageBg }}
    >
      {/* logo outside the card (top-right of the screen) */}
      <div className="absolute top-6 right-6">
        <Image
          src="/logo-name.png"
          alt="Scheduling of Care"
          width={220}
          height={80}
          className="object-contain"
          priority
        />
      </div>

      {/* card */}
      <div
        className="w-full max-w-4xl rounded-3xl shadow-lg overflow-hidden relative"
        style={{ backgroundColor: palette.cardBg, border: `1px solid ${palette.border}` }}
      >
        {/* header bar with centered title and left back button */}
        <div
          className="w-full flex items-center justify-center px-6 py-5 relative"
          style={{ backgroundColor: palette.header, color: palette.white }}
        >
          <button
            onClick={goBack}
            aria-label="Go back"
            className="absolute left-4 top-1/2 -translate-y-1/2 rounded-md p-2 focus:outline-none focus:ring-2"
            title="Back"
            style={{ color: palette.white }}
          >
            <BackIcon />
          </button>
          <h1 className="text-3xl font-bold">Manage Your Clients</h1>
        </div>

        {/* content */}
        <div className="px-8 pb-10 pt-6">
          <p className="text-2xl mb-4" style={{ color: palette.text }}>
            List of registered family members:
          </p>

          {/* scrollable list box */}
          <div
            className="mx-auto rounded-2xl bg-white overflow-y-auto mb-12"
            style={{
              maxHeight: 380,
              border: `2px solid ${palette.border}55`,
            }}
          >
            {/* list with dividers between items */}
            <ul className="divide-y divide-black/10">
              {members.map((name) => (
                <li
                  key={name}
                  className="flex items-center justify-between gap-6 px-8 py-5"
                  style={{ color: palette.text }}
                >
                  <span className="text-2xl">{name}</span>
                  <Link href="/menu" className="underline text-2xl">
                    View dashboard
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* help button inside the card, slightly above the bottom-right */}
        <button
          className="absolute bottom-6 right-6 w-9 h-9 rounded-full text-white font-bold"
          style={{ backgroundColor: palette.help }}
          aria-label="Help"
          title="Help"
        >
          ?
        </button>
      </div>
    </main>
  );
}

function BackIcon({ size = 24 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M15 18l-6-6 6-6" />
    </svg>
  );
}
