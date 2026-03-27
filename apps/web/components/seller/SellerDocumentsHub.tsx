"use client";

import { useMemo, useState } from "react";
import { SellerDocumentsPanel } from "./SellerDocumentsPanel";

export type SellerListingOption = { id: string; title: string; status: string };

function canEditListingStatus(status: string): boolean {
  return status !== "SOLD" && status !== "PENDING_VERIFICATION";
}

export function SellerDocumentsHub({ listings }: { listings: SellerListingOption[] }) {
  const initialId = listings[0]?.id ?? "";
  const [selectedId, setSelectedId] = useState(initialId);

  const selected = useMemo(() => listings.find((l) => l.id === selectedId), [listings, selectedId]);
  const canEdit = selected ? canEditListingStatus(selected.status) : false;

  if (listings.length === 0) {
    return (
      <p className="mt-6 rounded-xl border border-white/10 bg-[#121212] px-4 py-6 text-sm text-slate-400">
        Create a listing first, then upload documents for that property.
      </p>
    );
  }

  return (
    <div className="space-y-6">
      {listings.length > 1 ? (
        <label className="block max-w-xl text-sm">
          <span className="text-slate-400">Listing</span>
          <select
            className="mt-1 w-full rounded-xl border border-white/15 bg-[#121212] px-3 py-2.5 text-sm text-white"
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
          >
            {listings.map((l) => (
              <option key={l.id} value={l.id}>
                {l.title} ({l.status})
              </option>
            ))}
          </select>
        </label>
      ) : null}
      {selectedId ? <SellerDocumentsPanel fsboListingId={selectedId} canEdit={canEdit} /> : null}
    </div>
  );
}
