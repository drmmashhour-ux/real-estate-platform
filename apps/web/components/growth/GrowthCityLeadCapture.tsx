"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

function track(action: string, path: string | null, meta: Record<string, string>) {
  void fetch("/api/analytics/track", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      eventType: "growth_seo_lead_capture",
      path,
      meta: { ...meta, action },
    }),
  }).catch(() => {});
}

/**
 * Lead capture CTAs for programmatic city pages (save search, alerts, property request).
 */
export function GrowthCityLeadCapture({
  citySlug,
  cityQuery,
  intent,
}: {
  citySlug: string;
  cityQuery: string;
  intent: string;
}) {
  const path = usePathname();
  const searchReturn = `/search/bnhub?location=${encodeURIComponent(cityQuery)}`;
  const loginSave = `/auth/login?returnUrl=${encodeURIComponent(searchReturn)}`;

  return (
    <section
      className="border-t border-white/10 bg-gradient-to-r from-[#111] to-black py-10"
      aria-labelledby="growth-lead-capture"
    >
      <div className="mx-auto max-w-6xl px-4">
        <h2 id="growth-lead-capture" className="text-lg font-bold text-white">
          Stay ahead in {cityQuery}
        </h2>
        <p className="mt-1 text-sm text-white/60">Save a search, get alerts, or talk to the team.</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href={loginSave}
            onClick={() => track("save_search", path, { citySlug, intent })}
            className="rounded-xl border border-premium-gold/50 bg-premium-gold/10 px-5 py-3 text-sm font-semibold text-premium-gold hover:bg-premium-gold/20"
          >
            Save search
          </Link>
          <Link
            href={`/early-access?city=${encodeURIComponent(citySlug)}`}
            onClick={() => track("get_alerts", path, { citySlug, intent })}
            className="rounded-xl border border-white/20 px-5 py-3 text-sm font-medium text-white hover:bg-white/5"
          >
            Get alerts
          </Link>
          <Link
            href={`/contact?topic=property&city=${encodeURIComponent(cityQuery)}`}
            onClick={() => track("request_property", path, { citySlug, intent })}
            className="rounded-xl border border-white/20 px-5 py-3 text-sm font-medium text-white hover:bg-white/5"
          >
            Request property
          </Link>
        </div>
      </div>
    </section>
  );
}
