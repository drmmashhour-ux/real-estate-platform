"use client";

import type { ReactNode } from "react";
import { HUB_GOLD_CSS } from "./hub-tokens";

type HubFilterBarProps = {
  children: ReactNode;
  className?: string;
};

/** Config-driven filters render as children (inputs, selects). */
export function HubFilterBar({ children, className = "" }: HubFilterBarProps) {
  return (
    <div
      className={`flex flex-col gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-4 sm:flex-row sm:flex-wrap sm:items-end ${className}`}
      style={{ borderColor: `${HUB_GOLD_CSS}33` }}
    >
      {children}
    </div>
  );
}
