"use client";

import { useEffect } from "react";

import { trackEvent } from "@/lib/tracking/events";

import { LECIPM_DASHBOARD_CONSOLE_STORAGE_KEY } from "@/lib/dashboard/lecipm-console-preference";

type Variant = "classic" | "lecipm";

/**
 * Client beacons: console variant views + session duration on hide/unmount (best-effort).
 */
export function LecipmConsoleAnalytics(props: { variant: Variant }) {
  useEffect(() => {
    const path = typeof window !== "undefined" ? window.location.pathname : "";
    const startedAt = Date.now();
    trackEvent("dashboard_console_view", {
      variant: props.variant,
      path,
    });

    const storageVal = props.variant;
    try {
      localStorage.setItem(LECIPM_DASHBOARD_CONSOLE_STORAGE_KEY, storageVal);
    } catch {
      /* ignore */
    }

    const key = `lecipm_console_session_start_${props.variant}`;
    try {
      sessionStorage.setItem(key, String(startedAt));
    } catch {
      /* ignore */
    }

    const flush = () => {
      const raw = sessionStorage.getItem(key);
      if (!raw) return;
      const started = Number(raw);
      if (!Number.isFinite(started)) return;
      const durationMs = Math.max(0, Date.now() - started);
      trackEvent("dashboard_console_session_end", {
        variant: props.variant,
        durationMs,
        path: window.location.pathname,
      });
      sessionStorage.removeItem(key);
    };

    const onVisibility = () => {
      if (document.visibilityState === "hidden") flush();
    };

    const onPageHide = () => flush();

    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pagehide", onPageHide);

    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pagehide", onPageHide);
      flush();
    };
  }, [props.variant]);

  return null;
}
