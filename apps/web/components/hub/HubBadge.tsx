import type { ReactNode } from "react";
import { HUB_GOLD_CSS } from "./hub-tokens";

type HubBadgeProps = {
  children: ReactNode;
  variant?: "gold" | "muted";
};

export function HubBadge({ children, variant = "gold" }: HubBadgeProps) {
  const muted = variant === "muted";
  return (
    <span
      className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold uppercase tracking-wide ${
        muted ? "bg-white/10 text-white/70" : ""
      }`}
      style={!muted ? { backgroundColor: `${HUB_GOLD_CSS}22`, color: HUB_GOLD_CSS } : undefined}
    >
      {children}
    </span>
  );
}
