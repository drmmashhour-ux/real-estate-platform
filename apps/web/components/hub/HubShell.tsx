"use client";

import type { ReactNode } from "react";
import { HUB_BG, HUB_GOLD_CSS } from "./hub-tokens";

type HubShellProps = {
  children: ReactNode;
  className?: string;
  /** Visually offset main content under a sticky bar */
  padded?: boolean;
};

export function HubShell({ children, className = "", padded = true }: HubShellProps) {
  return (
    <div
      className={`min-h-screen text-white ${padded ? "pb-16 pt-6" : ""} ${className}`}
      style={{ backgroundColor: HUB_BG, borderTop: `3px solid ${HUB_GOLD_CSS}` }}
    >
      {children}
    </div>
  );
}
