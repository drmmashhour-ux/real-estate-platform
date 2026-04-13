"use client";

import { useEffect, useRef } from "react";
import { TrackingEvent, track } from "@/lib/tracking";

/**
 * First paint on a BNHUB stay detail URL with UTM params — on-site “ad click”
 * after the platform click. Pairs with `listing_view` + `booking_started` (same attribution).
 *
 * Ad URLs should use the exact listing segment + UTMs, e.g.
 * `buildBnhubStayAdLandingPath` with `utm_source=tiktok&utm_campaign=price_shock`.
 */
export function SocialAdLandingBeacon({
  listingId,
  surface,
}: {
  listingId: string;
  surface: "bnhub_stay";
}) {
  const sent = useRef(false);

  useEffect(() => {
    if (sent.current || !listingId || typeof window === "undefined") return;
    try {
      const sp = new URLSearchParams(window.location.search);
      const utmSource = sp.get("utm_source")?.trim();
      const utmCampaign = sp.get("utm_campaign")?.trim();
      const utmMedium = sp.get("utm_medium")?.trim();
      const utmContent = sp.get("utm_content")?.trim();
      const hasUtm = Boolean(utmSource || utmCampaign || utmMedium);
      if (!hasUtm) return;
      sent.current = true;
      track(TrackingEvent.AD_CLICK, {
        meta: {
          listing_id: listingId,
          surface,
          channel: "paid_social",
          ...(utmSource ? { utm_source: utmSource } : {}),
          ...(utmCampaign ? { utm_campaign: utmCampaign } : {}),
          ...(utmMedium ? { utm_medium: utmMedium } : {}),
          ...(utmContent ? { utm_content: utmContent } : {}),
        },
      });
    } catch {
      /* ignore */
    }
  }, [listingId, surface]);

  return null;
}
