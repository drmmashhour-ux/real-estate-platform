"use client";

import { useEffect, useRef } from "react";

/**
 * Fire once per mount for listed ids — pairs with click tracking on links (optional).
 */
export function RecommendationsImpressionBeacon(props: {
  listingIds: string[];
  widget: string;
  source: "similar" | "personalized" | "trending" | "recent" | "saved";
  listingKind?: "bnhub" | "fsbo";
}) {
  const sent = useRef(false);
  useEffect(() => {
    if (sent.current || props.listingIds.length === 0) return;
    sent.current = true;
    void fetch("/api/recommendations/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        listingIds: props.listingIds,
        widget: props.widget,
        source: props.source,
        listingKind: props.listingKind ?? "bnhub",
        event: "impression",
      }),
    }).catch(() => {});
  }, [props.listingIds, props.widget, props.source, props.listingKind]);

  return null;
}
