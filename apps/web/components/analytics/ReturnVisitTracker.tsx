"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { track, TrackingEvent } from "@/lib/tracking";

const NAV_KEY = "lecipm_nav_count_v1";
const RETURN_FLAG = "lecipm_return_visit_tracked_v1";

/**
 * Fires once per session when user navigates to a second distinct route (repeat engagement).
 */
export function ReturnVisitTracker() {
  const pathname = usePathname();
  const lastPath = useRef<string | null>(null);

  useEffect(() => {
    if (!pathname || pathname.startsWith("/api")) return;
    if (pathname === lastPath.current) return;
    lastPath.current = pathname;

    try {
      const raw = sessionStorage.getItem(NAV_KEY);
      const n = raw ? Number.parseInt(raw, 10) : 0;
      const next = Number.isFinite(n) ? n + 1 : 1;
      sessionStorage.setItem(NAV_KEY, String(next));

      if (next >= 2 && !sessionStorage.getItem(RETURN_FLAG)) {
        sessionStorage.setItem(RETURN_FLAG, "1");
        track(TrackingEvent.INVESTMENT_RETURN_VISIT, {
          meta: { path: pathname },
        });
      }
    } catch {
      /* ignore private mode */
    }
  }, [pathname]);

  return null;
}
