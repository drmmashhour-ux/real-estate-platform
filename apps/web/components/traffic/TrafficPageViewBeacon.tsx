"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";
import { trackPageView } from "@/lib/tracking";

/**
 * Fires one page_view per pathname + query change (public + app shell).
 */
export function TrafficPageViewBeacon() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const last = useRef<string>("");
  const sp = searchParams?.toString() ?? "";

  useEffect(() => {
    const path = sp ? `${pathname}?${sp}` : pathname || "/";
    if (!pathname) return;
    if (pathname.startsWith("/api")) return;
    if (last.current === path) return;
    last.current = path;
    trackPageView(path);
  }, [pathname, sp]);

  return null;
}
