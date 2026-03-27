"use client";

import { useEffect, useState } from "react";
import { ListingTrustBadge, type ListingTrustSnapshotSafe } from "@/components/trust/ListingTrustBadge";

type StatusJson = {
  snapshot?: ListingTrustSnapshotSafe;
  error?: string;
};

export function ListingTrustGraphPanel(props: { listingId: string | null; enabled: boolean }) {
  const { listingId, enabled } = props;
  const [snapshot, setSnapshot] = useState<ListingTrustSnapshotSafe | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled || !listingId) {
      setSnapshot(null);
      return;
    }
    let cancelled = false;
    setErr(null);
    void fetch(`/api/trustgraph/listings/${encodeURIComponent(listingId)}/status`, { credentials: "include" })
      .then(async (res) => {
        const j = (await res.json().catch(() => ({}))) as StatusJson;
        if (!res.ok) {
          throw new Error(typeof j.error === "string" ? j.error : "Status unavailable");
        }
        return j.snapshot ?? null;
      })
      .then((s) => {
        if (!cancelled) setSnapshot(s);
      })
      .catch((e: unknown) => {
        if (!cancelled) setErr(e instanceof Error ? e.message : "Failed to load");
      });
    return () => {
      cancelled = true;
    };
  }, [listingId, enabled]);

  if (!enabled || !listingId) return null;

  if (err) {
    return (
      <p className="mt-3 text-xs text-slate-500" role="status">
        Trust: {err}
      </p>
    );
  }

  return (
    <div className="mt-4">
      <ListingTrustBadge listingId={listingId} snapshot={snapshot} />
    </div>
  );
}
