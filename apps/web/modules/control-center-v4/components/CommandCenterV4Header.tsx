"use client";

import type { CompanyCommandCenterV4Payload } from "../company-command-center-v4.types";

const OVERALL: Record<CompanyCommandCenterV4Payload["v3"]["shared"]["overallStatus"], { label: string; className: string }> = {
  healthy: { label: "Healthy", className: "bg-emerald-950/80 text-emerald-100" },
  limited: { label: "Limited", className: "bg-amber-950/80 text-amber-100" },
  warning: { label: "Warning", className: "bg-orange-950/80 text-orange-100" },
  critical: { label: "Critical", className: "bg-rose-950/90 text-rose-50" },
};

export function CommandCenterV4Header({
  data,
  activeRoleLabel,
}: {
  data: CompanyCommandCenterV4Payload;
  activeRoleLabel: string;
}) {
  const st = data.v3.shared.overallStatus;
  const badge = OVERALL[st];
  return (
    <div className="flex flex-wrap items-end justify-between gap-4 border-b border-zinc-800 pb-6">
      <div>
        <h2 className="text-lg font-semibold text-zinc-100">Executive intelligence</h2>
        <p className="mt-1 text-xs text-zinc-500">
          Window: {data.meta.currentWindow.label} · vs {data.meta.previousWindow.label}
        </p>
        <p className="mt-1 text-xs text-zinc-500">
          Role / preset: <span className="text-zinc-300">{activeRoleLabel}</span>
        </p>
      </div>
      <div className="text-right">
        <p className="text-[10px] uppercase text-zinc-500">Overall</p>
        <span className={`mt-1 inline-block rounded-full px-3 py-1 text-xs font-medium ${badge.className}`}>{badge.label}</span>
      </div>
    </div>
  );
}
