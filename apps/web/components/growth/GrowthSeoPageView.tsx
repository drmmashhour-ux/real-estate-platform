"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

/**
 * Client beacon: growth SEO funnel analytics (page views + attribution meta).
 */
export function GrowthSeoPageView({
  intent,
  citySlug,
  pathVariant = "root",
}: {
  intent: string;
  citySlug: string;
  pathVariant?: "root" | "city";
}) {
  const path = usePathname();
  const sent = useRef(false);

  useEffect(() => {
    if (sent.current) return;
    sent.current = true;
    void fetch("/api/analytics/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        eventType: "growth_seo_page_view",
        path: path || null,
        meta: { intent, citySlug, pathVariant, growthEngine: true },
      }),
    }).catch(() => {});
  }, [path, intent, citySlug, pathVariant]);

  return null;
}
