"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { DemoEvents } from "@/lib/demo-event-types";

/**
 * Staging-only: sends lightweight page_view events to /api/demo/track.
 */
export function DemoPageViewTracker() {
  const pathname = usePathname();
  const last = useRef<string | null>(null);

  useEffect(() => {
    if (process.env.NEXT_PUBLIC_ENV !== "staging") return;
    if (!pathname || pathname === last.current) return;
    last.current = pathname;
    void fetch("/api/demo/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ event: DemoEvents.PAGE_VIEW, path: pathname }),
    }).catch(() => {});
  }, [pathname]);

  return null;
}
