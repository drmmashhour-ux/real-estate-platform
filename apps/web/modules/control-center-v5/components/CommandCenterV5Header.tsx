"use client";

import type { CompanyCommandCenterV5Payload } from "../company-command-center-v5.types";

const OVERALL: Record<CompanyCommandCenterV5Payload["shared"]["overallStatus"], { label: string; className: string }> = {
  healthy: { label: "Healthy", className: "bg-emerald-950/80 text-emerald-100" },
  limited: { label: "Limited", className: "bg-amber-950/80 text-amber-100" },
  warning: { label: "Warning", className: "bg-orange-950/80 text-orange-100" },
  critical: { label: "Critical", className: "bg-rose-950/90 text-rose-50" },
};

export function CommandCenterV5Header({ data }: { data: CompanyCommandCenterV5Payload }) {
  const st = data.shared.overallStatus;
  const badge = OVERALL[st];
  return (
    <div className="flex flex-wrap items-end justify-between gap-4 border-b border-zinc-800 pb-6">
      <div>
        <p className="text-xs text-zinc-500">
          {data.meta.currentWindow.label} · vs {data.meta.previousWindow.label}
        </p>
        <p className="mt-1 text-[10px] text-zinc-600">
          V4 echo: {data.v4Echo.briefingCardCount} briefing cards · {data.v4Echo.digestItemCount} digest ·{" "}
          {data.v4Echo.deltaChangedCount} changed deltas
        </p>
      </div>
      <span className={`rounded-full px-3 py-1 text-xs font-medium ${badge.className}`}>{badge.label}</span>
    </div>
  );
}
