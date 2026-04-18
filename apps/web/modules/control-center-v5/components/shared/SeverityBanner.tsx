"use client";

import type { CommandCenterIncidentSeverity } from "../../company-command-center-v5.types";

const STYLES: Record<CommandCenterIncidentSeverity, string> = {
  low: "border-zinc-700 bg-zinc-900/50 text-zinc-300",
  medium: "border-amber-800/60 bg-amber-950/30 text-amber-100",
  high: "border-orange-800/60 bg-orange-950/30 text-orange-100",
  critical: "border-rose-800/60 bg-rose-950/40 text-rose-50",
};

export function SeverityBanner({ severity, label }: { severity: CommandCenterIncidentSeverity; label: string }) {
  return (
    <div className={`rounded-lg border px-4 py-2 text-sm font-medium ${STYLES[severity]}`}>
      {label}: <span className="uppercase">{severity}</span>
    </div>
  );
}
