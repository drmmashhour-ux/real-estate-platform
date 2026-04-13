"use client";

import { useEffect } from "react";
import { fireContentPerformanceEvent } from "@/lib/content-machine/client-track";

function sessionKey(contentId: string) {
  return `lecipm_cp_view_${contentId}`;
}

/** Records one view per browser session when a validated `cc` is present on the BNHUB listing URL. */
export function ContentPerformanceViewBeacon({
  contentId,
  listingId,
}: {
  contentId: string;
  listingId: string;
}) {
  useEffect(() => {
    if (typeof sessionStorage === "undefined") return;
    if (sessionStorage.getItem(sessionKey(contentId))) return;
    sessionStorage.setItem(sessionKey(contentId), "1");
    fireContentPerformanceEvent(contentId, listingId, "view");
  }, [contentId, listingId]);

  return null;
}
