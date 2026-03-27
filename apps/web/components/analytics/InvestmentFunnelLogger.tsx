"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { track, TrackingEvent } from "@/lib/tracking";

/** Map pathname prefix → funnel step label for lightweight flow replay (TrafficEvent only). */
function stepForPath(pathname: string): string | null {
  const p = pathname.replace(/\/$/, "") || "/";
  if (p === "/") return "home";
  if (p === "/analyze" || p.startsWith("/analyze/")) return "analyze";
  if (p === "/dashboard" || p.startsWith("/dashboard/")) return "dashboard";
  if (p === "/compare" || p.startsWith("/compare/")) return "compare";
  if (p === "/demo/dashboard" || p.startsWith("/demo/dashboard")) return "demo_dashboard";
  if (p === "/demo/compare" || p.startsWith("/demo/compare")) return "demo_compare";
  if (p.startsWith("/deal/")) return "deal_share";
  return null;
}

/**
 * Logs discrete funnel steps when users navigate — no third-party session replay.
 */
export function InvestmentFunnelLogger() {
  const pathname = usePathname();
  const lastKey = useRef<string | null>(null);

  useEffect(() => {
    if (!pathname) return;
    const step = stepForPath(pathname);
    if (!step) return;
    const key = `${step}:${pathname}`;
    if (lastKey.current === key) return;
    lastKey.current = key;
    track(TrackingEvent.INVESTMENT_FUNNEL_STEP, {
      meta: { step, path: pathname.slice(0, 512) },
    });
  }, [pathname]);

  return null;
}
