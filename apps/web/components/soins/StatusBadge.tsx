"use client";

import type { SoinsUrgencyLevel } from "@/design-system/soins-hub";
import { SOINS_HUB } from "@/design-system/soins-hub";

const styles: Record<
  SoinsUrgencyLevel,
  { ring: string; dot: string; label: string }
> = {
  normal: {
    ring: "border-emerald-500/45 bg-emerald-500/10",
    dot: "bg-emerald-500",
    label: "Stable",
  },
  attention: {
    ring: "border-amber-400/55 bg-amber-400/12",
    dot: "bg-amber-400",
    label: "À suivre",
  },
  emergency: {
    ring: "border-red-500/55 bg-red-500/12",
    dot: "bg-red-500",
    label: "Urgent",
  },
};

export function StatusBadge(props: {
  level: SoinsUrgencyLevel;
  /** Override default French label */
  label?: string;
  className?: string;
}) {
  const s = styles[props.level];
  const text = props.label ?? s.label;

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-medium text-[#FAFAF8] ${s.ring} ${props.className ?? ""}`}
      role="status"
      style={{ color: SOINS_HUB.text }}
    >
      <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${s.dot}`} aria-hidden />
      {text}
    </span>
  );
}
