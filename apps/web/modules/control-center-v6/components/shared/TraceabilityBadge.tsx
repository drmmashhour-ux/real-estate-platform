"use client";

import type { CommandCenterAuditTrailEntry } from "../../company-command-center-v6.types";

const SEV: Record<CommandCenterAuditTrailEntry["severity"], string> = {
  info: "bg-zinc-800 text-zinc-300",
  watch: "bg-sky-950/80 text-sky-100",
  warning: "bg-amber-950/80 text-amber-100",
  critical: "bg-rose-950/90 text-rose-50",
};

export function TraceabilityBadge({ severity }: { severity: CommandCenterAuditTrailEntry["severity"] }) {
  return (
    <span className={`rounded px-1.5 py-0.5 text-[10px] font-medium uppercase ${SEV[severity]}`}>{severity}</span>
  );
}
