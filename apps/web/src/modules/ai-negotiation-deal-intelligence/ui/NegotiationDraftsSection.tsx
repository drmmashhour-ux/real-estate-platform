"use client";

import { CounterProposalDraftCard } from "@/src/modules/ai-negotiation-deal-intelligence/ui/CounterProposalDraftCard";
import { NegotiationMessageDraftPanel } from "@/src/modules/ai-negotiation-deal-intelligence/ui/NegotiationMessageDraftPanel";
import { NegotiationChainPanel } from "@/src/modules/negotiation-chain-engine/ui/NegotiationChainPanel";

/**
 * Phase 2 — reviewable negotiation drafts (no dispatch).
 */
export function NegotiationDraftsSection({
  listingId,
  documentId,
}: {
  listingId: string;
  documentId?: string | null;
}) {
  return (
    <div className="space-y-4 rounded-2xl border border-white/10 bg-[#0B0B0B]/80 p-5">
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#C9A646]">Negotiation drafts (Phase 2)</p>
        <p className="mt-1 text-xs text-slate-500">
          Counter-proposals and messages are built from your listing, declaration validation, and legal graph — plus optional plan context in the API.
          Review and edit before use; nothing is sent automatically.
        </p>
      </div>
      <NegotiationChainPanel listingId={listingId} documentId={documentId} />
      <CounterProposalDraftCard listingId={listingId} documentId={documentId} />
      <NegotiationMessageDraftPanel listingId={listingId} documentId={documentId} />
    </div>
  );
}
