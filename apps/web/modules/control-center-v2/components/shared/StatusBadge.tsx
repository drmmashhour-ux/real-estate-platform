"use client";

import type { ControlCenterUnifiedStatus } from "@/modules/control-center/ai-control-center.types";
import type { RolloutPostureUi } from "../../company-command-center-v2.types";

const HEALTH: Record<ControlCenterUnifiedStatus, { label: string; className: string }> = {
  healthy: { label: "Healthy", className: "border-emerald-800/60 bg-emerald-950/40 text-emerald-200" },
  limited: { label: "Limited", className: "border-amber-800/60 bg-amber-950/40 text-amber-200" },
  warning: { label: "Warning", className: "border-orange-800/60 bg-orange-950/40 text-orange-200" },
  critical: { label: "Critical", className: "border-rose-800/60 bg-rose-950/40 text-rose-200" },
  disabled: { label: "Disabled", className: "border-zinc-700 bg-zinc-900/60 text-zinc-500" },
  unavailable: { label: "Unavailable", className: "border-zinc-700 bg-zinc-900/60 text-zinc-500" },
};

const ROLLOUT: Record<RolloutPostureUi, { label: string; className: string }> = {
  disabled: { label: "Disabled", className: "border-zinc-700 text-zinc-500" },
  shadow: { label: "Shadow", className: "border-slate-600 text-slate-300" },
  influence: { label: "Influence", className: "border-violet-800/60 text-violet-200" },
  primary: { label: "Primary", className: "border-cyan-800/60 text-cyan-200" },
  limited: { label: "Limited", className: "border-amber-800/60 text-amber-200" },
  blocked: { label: "Blocked", className: "border-rose-800/60 text-rose-200" },
  unavailable: { label: "Unavailable", className: "border-zinc-700 text-zinc-500" },
};

export function HealthStatusBadge({ status }: { status: ControlCenterUnifiedStatus }) {
  const x = HEALTH[status];
  return <span className={`rounded border px-2 py-0.5 text-[10px] font-medium ${x.className}`}>{x.label}</span>;
}

export function RolloutPostureBadge({ posture }: { posture: RolloutPostureUi }) {
  const x = ROLLOUT[posture];
  return <span className={`rounded border px-2 py-0.5 text-[10px] font-medium ${x.className}`}>{x.label}</span>;
}
