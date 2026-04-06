import type { ReactNode } from "react";
import { HUB_GOLD_CSS } from "./hub-tokens";

type HubActionBarProps = {
  children: ReactNode;
  className?: string;
};

export function HubActionBar({ children, className = "" }: HubActionBarProps) {
  return (
    <div
      className={`flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 bg-black/30 px-4 py-3 ${className}`}
      style={{ borderColor: `${HUB_GOLD_CSS}40` }}
    >
      {children}
    </div>
  );
}
