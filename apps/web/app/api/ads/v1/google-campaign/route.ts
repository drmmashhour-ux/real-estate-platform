import { NextResponse } from "next/server";
import { landingConversionFlags } from "@/config/feature-flags";
import { requireUser } from "@/modules/security/access-guard.service";
import { generateGoogleAdsCampaign, type GoogleAdsCampaignType } from "@/modules/ads";

export const dynamic = "force-dynamic";

const TYPES = new Set<GoogleAdsCampaignType>(["BNHUB_GUEST", "HOST", "BUYER"]);

/** GET — Search campaign structure + keywords for Google Ads UI (no Google Ads API). */
export async function GET(req: Request) {
  if (!landingConversionFlags.googleAdsV1) {
    return NextResponse.json({ error: "Google ads builder is disabled" }, { status: 403 });
  }
  const auth = await requireUser();
  if (!auth.ok) return auth.response;

  const url = new URL(req.url);
  const raw = url.searchParams.get("campaignType")?.trim().toUpperCase() ?? "BNHUB_GUEST";
  const campaignType = raw as GoogleAdsCampaignType;
  if (!TYPES.has(campaignType)) {
    return NextResponse.json({ error: "Invalid campaignType (BNHUB_GUEST | HOST | BUYER)" }, { status: 400 });
  }
  const city = url.searchParams.get("city")?.trim() || "Montréal";

  const bundle = generateGoogleAdsCampaign({ city, campaignType });
  return NextResponse.json(bundle);
}
