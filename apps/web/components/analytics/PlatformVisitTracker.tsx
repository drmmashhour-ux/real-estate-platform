"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

/**
 * Fires once per pathname change (client navigation + initial load).
 * Persists through AppProviders so every routed page view increments platform visitors for UTC day.
 */
export function PlatformVisitTracker() {
  const pathname = usePathname();
  const trackedRef = useRef<string | null>(null);

  useEffect(() => {
    if (!pathname) return;
    if (trackedRef.current === pathname) return;
    trackedRef.current = pathname;

    void fetch("/api/analytics/track-visit", {
      method: "POST",
      keepalive: true,
    }).catch(() => {
      /* non-blocking */
    });
  }, [pathname]);

  return null;
}
