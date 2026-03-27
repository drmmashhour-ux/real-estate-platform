"use client";

import { marketingTheme } from "@/config/theme";

export function GradientGlow({ className = "" }: { className?: string }) {
  return (
    <div
      className={`pointer-events-none absolute inset-0 -z-10 overflow-hidden ${className}`}
      aria-hidden
    >
      <div
        className="absolute -left-1/4 top-0 h-[60%] w-[70%] rounded-full blur-[100px] opacity-40"
        style={{ background: `radial-gradient(circle, ${marketingTheme.accent}33 0%, transparent 70%)` }}
      />
      <div
        className="absolute -right-1/4 top-1/4 h-[50%] w-[60%] rounded-full blur-[90px] opacity-25"
        style={{ background: `radial-gradient(circle, ${marketingTheme.accent}44 0%, transparent 65%)` }}
      />
    </div>
  );
}
