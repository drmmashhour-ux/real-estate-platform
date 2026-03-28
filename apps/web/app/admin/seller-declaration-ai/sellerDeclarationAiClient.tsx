"use client";

import { useState } from "react";
import { SellerDeclarationEditor } from "@/src/modules/seller-declaration-ai/ui/SellerDeclarationEditor";

export function SellerDeclarationAiClient() {
  const [listingId, setListingId] = useState("");
  const [draft, setDraft] = useState<{ id: string; draftPayload?: Record<string, unknown> } | null>(null);
  const [error, setError] = useState("");

  async function loadDraft() {
    setError("");
    const res = await fetch(`/api/seller-declaration-ai/draft/${listingId}`);
    const json = await res.json();
    if (!res.ok) {
      setError(json.error ?? "Failed to load draft");
      return;
    }
    setDraft({ id: json.draft.id, draftPayload: json.draft.draftPayload ?? {} });
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-white/10 bg-black/20 p-4">
        <label className="text-xs text-slate-300">Listing ID</label>
        <div className="mt-2 flex gap-2">
          <input value={listingId} onChange={(e) => setListingId(e.target.value)} className="w-full rounded-lg bg-black/40 p-2 text-sm text-white" placeholder="Enter listing id" />
          <button type="button" onClick={loadDraft} className="rounded-lg bg-premium-gold px-3 py-2 text-xs font-medium text-black">Load draft</button>
        </div>
        {error ? <p className="mt-2 text-xs text-rose-300">{error}</p> : null}
      </div>
      {draft ? <SellerDeclarationEditor listingId={listingId} initialDraftId={draft.id} initialPayload={draft.draftPayload} /> : null}
    </div>
  );
}
