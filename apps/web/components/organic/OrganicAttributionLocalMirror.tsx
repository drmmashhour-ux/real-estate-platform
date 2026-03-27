"use client";

import { useEffect } from "react";
import { LECIPM_ATTRIBUTION_COOKIE } from "@/lib/attribution/constants";

/** Mirrors first-touch attribution cookie into localStorage for debugging / future client use. */
export function OrganicAttributionLocalMirror() {
  useEffect(() => {
    try {
      const safe = LECIPM_ATTRIBUTION_COOKIE.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const match = document.cookie.match(new RegExp(`(?:^|; )${safe}=([^;]*)`));
      const raw = match?.[1];
      if (raw) {
        const decoded = decodeURIComponent(raw);
        localStorage.setItem("lecipm_organic_attribution", decoded);
      }
    } catch {
      /* ignore */
    }
  }, []);
  return null;
}
