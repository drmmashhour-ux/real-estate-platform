"use client";

import { useEffect, useRef } from "react";
import { DemoEvents } from "@/lib/demo-event-types";

export function CalendarViewedTracker({ role }: { role: string }) {
  const sent = useRef(false);
  useEffect(() => {
    if (process.env.NEXT_PUBLIC_ENV !== "staging" || sent.current) return;
    sent.current = true;
    void fetch("/api/demo/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({ event: DemoEvents.CALENDAR_VIEWED, metadata: { role } }),
    });
  }, [role]);
  return null;
}
