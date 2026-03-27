"use client";

import type { BnhubMarketingRecommendation } from "@prisma/client";
import { m } from "./marketing-ui-classes";

const PRIORITY_RING: Record<string, string> = {
  CRITICAL: "border-red-500/50",
  HIGH: "border-amber-500/50",
  MEDIUM: "border-zinc-600",
  LOW: "border-zinc-800",
};

export function RecommendationCard({
  rec,
  onApply,
  onDismiss,
  busyId,
}: {
  rec: BnhubMarketingRecommendation;
  onApply?: (id: string) => void;
  onDismiss?: (id: string) => void;
  busyId?: string | null;
}) {
  const ring = PRIORITY_RING[rec.priority] ?? PRIORITY_RING.MEDIUM;
  return (
    <div className={`rounded-xl border bg-zinc-900/50 p-4 ${ring}`}>
      <div className="mb-1 flex flex-wrap items-center gap-2">
        <span className="text-xs font-semibold text-amber-400/90">{rec.recommendationType.replace(/_/g, " ")}</span>
        <span className="text-[10px] uppercase text-zinc-500">{rec.priority}</span>
      </div>
      <p className="font-medium text-white">{rec.title}</p>
      <p className="mt-1 text-sm text-zinc-400">{rec.description}</p>
      {(onApply || onDismiss) && rec.status === "OPEN" ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {onApply ? (
            <button
              type="button"
              className={m.btnPrimary}
              disabled={busyId === rec.id}
              onClick={() => onApply(rec.id)}
            >
              {rec.actionLabel || "Apply"}
            </button>
          ) : null}
          {onDismiss ? (
            <button
              type="button"
              className={m.btnGhost}
              disabled={busyId === rec.id}
              onClick={() => onDismiss(rec.id)}
            >
              Dismiss
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
