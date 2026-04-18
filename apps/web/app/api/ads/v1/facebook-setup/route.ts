import { NextResponse } from "next/server";
import { landingConversionFlags } from "@/config/feature-flags";
import { requireUser } from "@/modules/security/access-guard.service";
import { generateFacebookAdsSetup, type FacebookCampaignType } from "@/modules/ads";

export const dynamic = "force-dynamic";

const TYPES = new Set<FacebookCampaignType>(["BNHUB_GUEST", "HOST", "BUYER"]);

/** GET — Meta Ads Manager checklist + copy blocks (no Graph API; no spend). */
export async function GET(req: Request) {
  if (!landingConversionFlags.facebookAdsV1) {
    return NextResponse.json({ error: "Facebook ads builder is disabled" }, { status: 403 });
  }
  const auth = await requireUser();
  if (!auth.ok) return auth.response;

  const url = new URL(req.url);
  const raw = url.searchParams.get("campaignType")?.trim().toUpperCase() ?? "BNHUB_GUEST";
  const campaignType = raw as FacebookCampaignType;
  if (!TYPES.has(campaignType)) {
    return NextResponse.json({ error: "Invalid campaignType (BNHUB_GUEST | HOST | BUYER)" }, { status: 400 });
  }
  const city = url.searchParams.get("city")?.trim() || "Montréal";
  const budgetRaw = url.searchParams.get("budget");
  const n = budgetRaw != null ? Number(budgetRaw) : NaN;
  const budgetUsd = Number.isFinite(n) && n > 0 ? n : undefined;

  const setup = generateFacebookAdsSetup({ campaignType, city, budgetUsd });
  return NextResponse.json(setup);
}
