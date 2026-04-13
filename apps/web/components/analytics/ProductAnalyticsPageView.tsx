"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { gtagPageView } from "@/modules/analytics/services/gtag";

/**
 * GA4 SPA page views (initial HTML is handled by gtag config; client navigations need `page_path` updates).
 * Plausible: default script tracks SPAs per Plausible docs. PostHog: `PostHogPageView`.
 */
export function ProductAnalyticsPageView() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (typeof window === "undefined") return;
    const path = pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : "");
    gtagPageView(path);
  }, [pathname, searchParams]);

  return null;
}
