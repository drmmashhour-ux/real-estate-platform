"use client";

import { useEffect, useRef } from "react";

/** One-shot homepage impression — manual/local-first analytics. */
export function HomeGrowthBeacon() {
  const sent = useRef(false);

  useEffect(() => {
    if (sent.current) return;
    sent.current = true;
    const qs = typeof window !== "undefined" ? window.location.search.slice(1) : "";
    const params = new URLSearchParams(qs);

    void fetch("/api/analytics/event", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        eventType: "homepage_view",
        payload: { path: typeof window !== "undefined" ? window.location.pathname : "/" },
        utm_source: params.get("utm_source") ?? undefined,
        utm_medium: params.get("utm_medium") ?? undefined,
        utm_campaign: params.get("utm_campaign") ?? undefined,
      }),
    }).catch(() => {});
  }, []);

  return null;
}
