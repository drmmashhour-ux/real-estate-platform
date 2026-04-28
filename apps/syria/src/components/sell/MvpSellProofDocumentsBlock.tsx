"use client";

import { useState } from "react";
import { ListingProofDocumentsFields, type ListingProofDoc } from "@/components/listing/ListingProofDocumentsFields";

/** MVP sell — hydrates hidden JSON consumed by `createMvpPropertyListing`. */
export function MvpSellProofDocumentsBlock() {
  const [docs, setDocs] = useState<ListingProofDoc[]>([]);
  const [banner, setBanner] = useState<string | null>(null);

  return (
    <div className="space-y-2">
      {banner ? (
        <div className="rounded-[var(--darlink-radius-lg)] border border-rose-200/90 bg-rose-50 px-3 py-2 text-sm text-rose-950 [dir=rtl]:text-right">
          {banner}
        </div>
      ) : null}
      <ListingProofDocumentsFields
        value={docs}
        onChange={(next) => {
          setDocs(next);
          setBanner(null);
        }}
        onUploadError={(msg) => setBanner(msg)}
      />
      <input type="hidden" name="proofDocumentsJson" value={docs.length ? JSON.stringify(docs) : ""} />
    </div>
  );
}
