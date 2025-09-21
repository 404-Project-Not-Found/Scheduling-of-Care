"use client";

import { ReactNode } from "react";

type BadgeProps = {
  children: ReactNode;
  tone: "green" | "yellow" | "red";
};

export default function Badge({ children, tone }: BadgeProps) {
  const styles: Record<"green" | "yellow" | "red", string> = {
    green: "bg-green-100 text-green-800",
    yellow: "bg-yellow-100 text-yellow-800",
    red: "bg-red-100 text-red-800",
  };

  return (
    <span
      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${styles[tone]}`}
    >
      {children}
    </span>
  );
}