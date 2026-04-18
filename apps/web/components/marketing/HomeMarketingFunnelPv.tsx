"use client";

import { useEffect } from "react";
import { recordHomepagePageViewOnce } from "@/modules/conversion/funnel-metrics.service";

/** Deduped homepage funnel page_view when using `LecipmMarketingLandingV1` (standalone shell without `LecipmHomeLanding`). */
export function HomeMarketingFunnelPv() {
  useEffect(() => {
    recordHomepagePageViewOnce();
  }, []);
  return null;
}
