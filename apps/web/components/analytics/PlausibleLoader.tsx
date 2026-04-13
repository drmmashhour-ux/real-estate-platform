"use client";

import Script from "next/script";
import { PLAUSIBLE_DOMAIN } from "@/lib/analytics/product-analytics";

/** Plausible — set NEXT_PUBLIC_PLAUSIBLE_DOMAIN (e.g. lecipm.com). */
export function PlausibleLoader() {
  if (!PLAUSIBLE_DOMAIN) return null;

  return (
    <Script
      defer
      data-domain={PLAUSIBLE_DOMAIN}
      src="https://plausible.io/js/script.js"
      strategy="afterInteractive"
    />
  );
}
