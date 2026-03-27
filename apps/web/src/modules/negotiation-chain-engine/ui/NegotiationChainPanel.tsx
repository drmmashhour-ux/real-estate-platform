"use client";

import { NegotiationTimelineWorkspace } from "@/src/modules/negotiation-chain-engine/ui/NegotiationTimelineWorkspace";

export function NegotiationChainPanel({ listingId, documentId }: { listingId: string; documentId?: string | null }) {
  return (
    <div className="space-y-4 rounded-xl border border-white/10 bg-[#0a0a0a] p-4">
      <NegotiationTimelineWorkspace listingId={listingId} documentId={documentId ?? null} />
    </div>
  );
}
