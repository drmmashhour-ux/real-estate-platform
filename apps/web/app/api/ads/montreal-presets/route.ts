import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/admin/require-admin";
import {
  MONTREAL_KEYWORD_BANK,
  MONTREAL_READY_CAMPAIGNS,
  buildTrackedLandingUrl,
} from "@/modules/ads";

export const dynamic = "force-dynamic";

/** GET /api/ads/montreal-presets — Google Ads–ready Montréal bundles (admin). */
export async function GET() {
  const s = await requireAdminSession();
  if (!s.ok) return NextResponse.json({ error: s.error }, { status: s.status });

  const presets = MONTREAL_READY_CAMPAIGNS.map((p) => ({
    ...p,
    trackedUrlFrCa: buildTrackedLandingUrl({
      localeCountryPrefix: "/fr/ca",
      landingPath: p.landingPath,
      utm: {
        utm_source: "google",
        utm_medium: "cpc",
        utm_campaign: p.utmCampaign,
      },
    }),
    trackedUrlEnCa: buildTrackedLandingUrl({
      localeCountryPrefix: "/en/ca",
      landingPath: p.landingPath,
      utm: {
        utm_source: "google",
        utm_medium: "cpc",
        utm_campaign: p.utmCampaign,
      },
    }),
  }));

  return NextResponse.json({
    keywordBank: [...MONTREAL_KEYWORD_BANK],
    presets,
  });
}
