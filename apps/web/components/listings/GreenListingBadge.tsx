"use client";

import type { GreenSearchResultDecoration, PublicListingGreenPayload } from "@/modules/green-ai/green-search.types";

type Props = {
  green: PublicListingGreenPayload | Pick<GreenSearchResultDecoration, "label" | "improvementPotential" | "currentScore">;
  compact?: boolean;
};

const LABEL: Record<NonNullable<PublicListingGreenPayload["label"]>, string> = {
  GREEN: "Green (modeled)",
  IMPROVABLE: "Improvable",
  LOW: "More upgrades likely",
};

/**
 * Public badges: Québec-inspired band, optional “upgrade potential”, never official certification.
 */
export function GreenListingBadge({ green, compact = true }: Props) {
  const full = "disclaimer" in green ? (green as PublicListingGreenPayload) : null;
  const lb = "label" in green && green.label != null ? LABEL[green.label] : null;
  const up =
    "improvementPotential" in green && green.improvementPotential
      ? green.improvementPotential === "high" || green.improvementPotential === "medium"
      : false;
  if (!lb && (green as PublicListingGreenPayload).currentScore == null && !up) {
    return null;
  }
  return (
    <span className="inline-flex flex-wrap items-center gap-1">
      {(lb != null || (green as PublicListingGreenPayload).currentScore != null) && (
        <span
          className="inline-flex items-center gap-1 rounded border border-emerald-500/35 bg-emerald-950/40 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-emerald-200/90"
          title={
            full?.quebecLabel
              ? `Québec factor-model: ${full.quebecLabel} — not a government or EnerGuide label.`
              : "Québec-inspired model — not a government or EnerGuide label."
          }
        >
          {!compact ? "Québec-inspired: " : null}
          {lb ?? "Québec-inspired score"}
        </span>
      )}
      {up ? (
        <span
          className="inline-flex items-center rounded border border-amber-500/35 bg-amber-950/30 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-amber-100/90"
          title="Modeled upgrade potential only — not a guarantee of work scope or return."
        >
          Upgrade potential
        </span>
      ) : null}
    </span>
  );
}
