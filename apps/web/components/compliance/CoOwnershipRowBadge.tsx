"use client";

import { useEffect, useState } from "react";
import { ComplianceStatusBadge } from "./ComplianceStatusBadge";

type Props = {
  listingId: string;
  listingType: string;
  isCoOwnership: boolean;
  size?: "sm" | "md";
};

/**
 * Fetches co-ownership status for list rows (condo / co-ownership only).
 */
export function CoOwnershipRowBadge({ listingId, listingType, isCoOwnership, size = "sm" }: Props) {
  const [applies, setApplies] = useState(false);
  const [complete, setComplete] = useState(false);
  const [ready, setReady] = useState(false);

  const show = listingType === "CONDO" || isCoOwnership;
  useEffect(() => {
    if (!show) {
      setReady(true);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/compliance/${encodeURIComponent(listingId)}`, { credentials: "same-origin" });
        const j = (await res.json().catch(() => ({}))) as { applies?: boolean; complete?: boolean };
        if (cancelled) return;
        setApplies(!!j.applies);
        setComplete(!!j.complete);
      } catch {
        if (cancelled) return;
        setApplies(show);
        setComplete(false);
      } finally {
        if (!cancelled) setReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [listingId, show]);

  if (!show || !ready) return null;

  return <ComplianceStatusBadge applies={applies} complete={complete} size={size} />;
}
