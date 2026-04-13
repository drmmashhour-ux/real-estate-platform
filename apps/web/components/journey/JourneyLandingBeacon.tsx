"use client";

import { useEffect, useRef } from "react";

/**
 * One landing_visit per browser session (marketing home).
 */
export function JourneyLandingBeacon() {
  const sent = useRef(false);
  useEffect(() => {
    if (sent.current) return;
    if (typeof window === "undefined") return;
    if (sessionStorage.getItem("lecipm_journey_landing")) return;
    sessionStorage.setItem("lecipm_journey_landing", "1");
    sent.current = true;
    void fetch("/api/journey/event", {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "landing_visit", metadata: { surface: "marketing_home" } }),
    }).catch(() => {});
  }, []);
  return null;
}
