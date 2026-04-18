"use client";

import type { ReactNode } from "react";
import { useEffect, useRef } from "react";
import { MarketingAnalyticsEvents, trackMarketingEvent } from "@/lib/analytics";

/** Fires pricing_view once when the pricing block enters the viewport. */
export function PricingSectionClient({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const sent = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e?.isIntersecting && !sent.current) {
          sent.current = true;
          trackMarketingEvent(MarketingAnalyticsEvents.pricingView, { surface: "landing_v1" });
        }
      },
      { threshold: 0.2 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return <div ref={ref}>{children}</div>;
}
