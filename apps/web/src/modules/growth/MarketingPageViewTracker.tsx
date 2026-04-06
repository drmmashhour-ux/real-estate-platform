"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { trackLaunchEvent } from "@/src/modules/launch/LaunchTracker";

function localeFromDocument(): string | undefined {
  if (typeof document === "undefined") return undefined;
  const lang = document.documentElement.lang?.trim().toLowerCase();
  if (lang.startsWith("ar")) return "ar";
  if (lang.startsWith("fr")) return "fr";
  return "en";
}

/**
 * Emits `PAGE_VIEW` to `LaunchEvent` via `/api/launch/track` (client).
 * Also records manager funnel `landing_page_viewed` / path context via `/api/growth/manager-track`.
 */
export function MarketingPageViewTracker() {
  const pathname = usePathname();
  const sentForPath = useRef<string | null>(null);

  useEffect(() => {
    if (!pathname) return;
    if (sentForPath.current === pathname) return;
    sentForPath.current = pathname;
    void trackLaunchEvent("PAGE_VIEW", { path: pathname });
    const locale = localeFromDocument();
    void fetch("/api/growth/manager-track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({
        event: "landing_page_viewed",
        path: pathname,
        locale,
      }),
    }).catch(() => {});
  }, [pathname]);

  return null;
}
