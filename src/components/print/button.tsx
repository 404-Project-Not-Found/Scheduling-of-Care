'use client';

import React, { useEffect, useState } from 'react';
import { FaPrint } from 'react-icons/fa';

export default function PrintFloatingButton() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null; // 避免 SSR 输出任何 HTML

  return (
    <button
      type="button"
      aria-label="Print"
      title="Print"
      onClick={() => window.print()}
      className="
        print:hidden
        fixed bottom-6 right-[84px]
        flex h-12 w-12 items-center justify-center
        rounded-full bg-[#3A0000] text-white
        shadow-md hover:shadow-lg
        transition-colors hover:bg-[#502121]
        focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70
      "
    >
      <FaPrint className="w-5 h-5" />
      <span className="sr-only">Print</span>
    </button>
  );
}
