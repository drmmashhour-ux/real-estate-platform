"use client";

import type { PublicListingGreenPayload } from "@/modules/green-ai/green-search.types";
import { GREEN_COPY } from "@/modules/green-ai/green-discovery-copy.service";

type Props = {
  green: PublicListingGreenPayload;
};

/**
 * One-line + disclaimer for listing cards. Never government certification.
 */
export function GreenOpportunityCard({ green }: Props) {
  const line = green.rationale[0] ?? "Québec-inspired green context — verify independently.";
  return (
    <div className="rounded border border-white/10 bg-white/[0.03] p-2 text-xs text-white/75">
      <p className="text-white/90">{line}</p>
      <p className="mt-1 text-[10px] text-white/45">
        {GREEN_COPY.disclaimerShort} {green.disclaimer}
      </p>
    </div>
  );
}
