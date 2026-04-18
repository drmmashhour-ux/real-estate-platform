"use client";

import type { CompanyCommandCenterV6Payload } from "../company-command-center-v6.types";

const OVERALL: Record<CompanyCommandCenterV6Payload["shared"]["overallStatus"], { label: string; className: string }> = {
  healthy: { label: "Healthy", className: "bg-emerald-950/80 text-emerald-100" },
  limited: { label: "Limited", className: "bg-amber-950/80 text-amber-100" },
  warning: { label: "Warning", className: "bg-orange-950/80 text-orange-100" },
  critical: { label: "Critical", className: "bg-rose-950/90 text-rose-50" },
};

export function CommandCenterV6Header({ data }: { data: CompanyCommandCenterV6Payload }) {
  const st = data.shared.overallStatus;
  const badge = OVERALL[st];
  return (
    <div className="flex flex-wrap items-end justify-between gap-4 border-b border-zinc-800 pb-6">
      <div>
        <p className="text-xs text-zinc-500">
          {data.meta.currentWindow.label} · vs {data.meta.previousWindow.label}
        </p>
        <p className="mt-1 text-[10px] text-zinc-600">
          Sources: {data.meta.sourcesUsed.slice(0, 6).join(", ")}
          {data.meta.sourcesUsed.length > 6 ? "…" : ""}
        </p>
        <p className="mt-1 text-[10px] text-zinc-600">
          Systems loaded: {data.shared.meta.systemsLoadedCount}
          {data.meta.v1HistoryAvailable ? " · V1 history available" : " · V1 history empty/unavailable"}
        </p>
      </div>
      <span className={`rounded-full px-3 py-1 text-xs font-medium ${badge.className}`}>{badge.label}</span>
    </div>
  );
}
