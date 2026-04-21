"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { SubsidyPipelineStage } from "@/modules/green-ai/pipeline/pipeline.types";
import { nextSubsidyPipelineStage } from "@/modules/green-ai/pipeline/upgrade-flow";

type Props = {
  listingId: string;
  currentStage: SubsidyPipelineStage;
};

export function AdvanceGreenProjectStageButton({ listingId, currentStage }: Props) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const next = nextSubsidyPipelineStage(currentStage);
  if (!next) return null;

  async function onClick() {
    setPending(true);
    try {
      const res = await fetch(`/api/green/pipeline/${listingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stage: next }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        console.warn("[pipeline] advance_stage_failed", err);
      }
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  const label =
    next === "PLANNING"
      ? "Continue to ROI planning"
      : next === "EXECUTION"
        ? "Continue to contractors"
        : next === "COMPLETED"
          ? "Mark completion"
          : "Next";

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => void onClick()}
      className="rounded-xl bg-emerald-600/90 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500 disabled:opacity-60"
    >
      {pending ? "Saving…" : label}
    </button>
  );
}
