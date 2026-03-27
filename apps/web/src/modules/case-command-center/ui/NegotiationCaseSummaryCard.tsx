"use client";

import { NegotiationTimelineWorkspace } from "@/src/modules/negotiation-chain-engine/ui/NegotiationTimelineWorkspace";

export function NegotiationCaseSummaryCard({ listingId, documentId }: { listingId: string; documentId: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/15 p-4">
      <p className="mb-3 text-sm font-semibold text-white">Negotiation</p>
      <NegotiationTimelineWorkspace listingId={listingId} documentId={documentId} compact />
    </div>
  );
}
