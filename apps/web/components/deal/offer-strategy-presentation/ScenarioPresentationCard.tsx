"use client";

import type { ReactNode } from "react";

/**
 * Screen-share / print-friendly wrapper. Add print styles later without changing layout structure.
 */
export function ScenarioPresentationCard({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-gradient-to-b from-[#161616] to-[#0f0f0f] p-5 shadow-lg print:border print:border-neutral-600 print:bg-white print:text-black print:shadow-none">
      {children}
    </div>
  );
}
