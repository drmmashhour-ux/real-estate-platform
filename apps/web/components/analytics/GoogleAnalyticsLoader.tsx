"use client";

import Script from "next/script";
import { GA_MEASUREMENT_ID } from "@/modules/analytics/services/gtag";

/**
 * GA4 tag — loads only when ID is configured. Pair with CookieConsentBanner for GDPR-style
 * opt-in if you expand consent granularity later.
 */
export function GoogleAnalyticsLoader() {
  const adsId =
    typeof process !== "undefined" ? process.env.NEXT_PUBLIC_GOOGLE_ADS_ID?.trim() ?? "" : "";
  if (!GA_MEASUREMENT_ID && !adsId) return null;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID || adsId}`}
        strategy="afterInteractive"
      />
      <Script id="lecipm-ga4-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          ${GA_MEASUREMENT_ID ? `gtag('config', '${GA_MEASUREMENT_ID}', { anonymize_ip: true });` : ""}
          ${adsId ? `gtag('config', '${adsId}');` : ""}
        `}
      </Script>
    </>
  );
}
