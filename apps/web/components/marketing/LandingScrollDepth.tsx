"use client";

import { useEffect, useRef } from "react";
import { MarketingAnalyticsEvents, trackMarketingEvent } from "@/lib/analytics";

const THRESHOLDS = [25, 50, 75, 100] as const;

/**
 * Fires `scroll_depth` once per threshold for the current page view.
 */
export function LandingScrollDepth() {
  const fired = useRef<Set<number>>(new Set());

  useEffect(() => {
    const onScroll = () => {
      const doc = document.documentElement;
      const scrollable = doc.scrollHeight - window.innerHeight;
      const pct = scrollable <= 0 ? 100 : Math.round((window.scrollY / scrollable) * 100);
      for (const t of THRESHOLDS) {
        if (pct >= t && !fired.current.has(t)) {
          fired.current.add(t);
          trackMarketingEvent(MarketingAnalyticsEvents.scrollDepth, { depth_pct: t });
        }
      }
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return null;
}
