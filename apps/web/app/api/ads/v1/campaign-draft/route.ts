import { NextResponse } from "next/server";
import { prisma } from "@repo/db";
import { softLaunchFlags } from "@/config/feature-flags";
import { requireUser } from "@/modules/security/access-guard.service";
import { buildInternalAdsCampaign, type AdsAudience } from "@/modules/ads";

export const dynamic = "force-dynamic";

const AUDIENCES = new Set<AdsAudience>(["buyer", "host", "renter", "broker", "investor"]);

async function resolveListingTitle(raw: string | null): Promise<string | null> {
  if (!raw) return null;
  const id = raw.replace(/^(fsbo:|bnhub:)/, "");
  const st = await prisma.shortTermListing.findUnique({ where: { id }, select: { title: true } });
  if (st) return st.title;
  const fs = await prisma.fsboListing.findUnique({ where: { id }, select: { title: true } });
  if (fs?.title) return fs.title;
  const bhl = await prisma.bnhubHostListing.findUnique({ where: { id }, select: { title: true } });
  return bhl?.title ?? null;
}

/** GET — internal ads campaign draft (copy + checklist; no API connection). */
export async function GET(req: Request) {
  if (!softLaunchFlags.adsEngineV1) {
    return NextResponse.json({ error: "Ads engine is disabled" }, { status: 403 });
  }
  const auth = await requireUser();
  if (!auth.ok) return auth.response;

  const url = new URL(req.url);
  const city = url.searchParams.get("city")?.trim() || "Montréal";
  const audienceRaw = url.searchParams.get("audience")?.trim() || "buyer";
  const audience = (AUDIENCES.has(audienceRaw as AdsAudience) ? audienceRaw : "buyer") as AdsAudience;
  const listingParam = url.searchParams.get("listingId")?.trim() ?? null;

  const listingTitle = await resolveListingTitle(listingParam);

  const campaign = buildInternalAdsCampaign({
    listingId: listingParam,
    city,
    audience,
    listingTitle,
  });

  return NextResponse.json(campaign);
}
