import { prisma } from "@/lib/db";

import type { VideoDurationTarget, VideoSceneType, VideoScriptVm, VideoTemplateKey } from "./video-engine.types";
import { scenePreset } from "./video-template.service";

function uniqTags(xs: string[]) {
  return [...new Set(xs.map((x) => x.replace(/^#/, "").trim()).filter(Boolean))].slice(0, 10);
}

/** Strip spam patterns; keeps premium tone */
export function sanitizeCaption(raw: string): string {
  let s = raw.replace(/\!{3,}/g, "!");
  s = s.replace(/\b(guaranteed|risk[- ]free|sure thing)\b/gi, "structured");
  if (s.length > 2000) s = s.slice(0, 2000);
  return s.trim();
}

function mkScene(id: string, type: VideoSceneType, dur: number, lines: string[]): VideoScriptVm["scenes"][0] {
  const p = scenePreset(type);
  return {
    id,
    type,
    durationSec: dur,
    overlayLines: lines.map((l) => l.slice(0, 120)),
    transitionIn: p.transitionIn,
    transitionOut: p.transitionOut,
  };
}

export async function generateListingVideoScript(
  listingId: string,
  durationTargetSec: VideoDurationTarget = 30,
): Promise<VideoScriptVm> {
  const L = await prisma.listing.findUnique({
    where: { id: listingId },
    select: { listingCode: true, title: true, price: true },
  });
  if (!L) throw new Error("CRM listing not found");

  const hook = `Luxury spotlight · ${L.title.slice(0, 56)}`;
  const scenes = [
    mkScene("s1", "hero_image", Math.max(4, durationTargetSec * 0.35), [L.title.slice(0, 72), `${L.listingCode}`]),
    mkScene("s2", "pricing_card", Math.max(4, durationTargetSec * 0.25), [`${L.price.toLocaleString("en-CA")} CAD`, "Marketplace-verified"]),
    mkScene("s3", "cta_card", Math.max(3, durationTargetSec * 0.2), ["LECIPM", "Browse listings"]),
  ];

  const caption = sanitizeCaption(
    `${hook}\n\nExplore this property on LECIPM — brokerage-grade workflows, transparent journey.\n\n#LECIPM #RealEstate`,
  );

  return {
    templateKey: "listing_spotlight",
    sourceKind: "crm_listing",
    sourceId: listingId,
    title: `${L.title.slice(0, 72)}`,
    hook,
    scenes,
    captions: scenes.flatMap((s) => s.overlayLines),
    cta: "See details on LECIPM.",
    hashtags: uniqTags(["LECIPM", "Listing", L.listingCode]),
    suggestedCaption: caption,
    targetPlatform: "instagram_reels",
    durationTargetSec,
    complianceNotes: ["Past performance does not guarantee future results for any investment context."],
    mediaWarning: null,
  };
}

export async function generateLuxuryShowcaseVideoScript(fsboId: string, durationTargetSec: VideoDurationTarget = 45): Promise<VideoScriptVm> {
  const f = await prisma.fsboListing.findUnique({
    where: { id: fsboId },
    select: { title: true, city: true, priceCents: true },
  });
  if (!f) throw new Error("FSBO listing not found");

  const price = (f.priceCents / 100).toLocaleString("en-CA");
  const hook = `Luxury property showcase · ${f.city}`;
  const scenes = [
    mkScene("s1", "hero_image", durationTargetSec * 0.38, [f.title.slice(0, 72), f.city]),
    mkScene("s2", "details_card", durationTargetSec * 0.28, ["Seller Hub", `${price} CAD`]),
    mkScene("s3", "cta_card", durationTargetSec * 0.22, ["LECIPM Seller Hub", "Tour the listing"]),
  ];

  return {
    templateKey: "luxury_property_showcase",
    sourceKind: "fsbo_listing",
    sourceId: fsboId,
    title: hook,
    hook,
    scenes,
    captions: scenes.flatMap((s) => s.overlayLines),
    cta: "Discover on LECIPM.",
    hashtags: uniqTags(["LuxuryHomes", "LECIPM", f.city]),
    suggestedCaption: sanitizeCaption(`${hook}\n\nPremium presentation on LECIPM Seller Hub.`),
    targetPlatform: "instagram_reels",
    durationTargetSec,
    complianceNotes: [],
    mediaWarning: null,
  };
}

/** Alias for BNHub — user-facing name */
export async function generateBNHubVideoScript(stayId: string, durationTargetSec: VideoDurationTarget = 30): Promise<VideoScriptVm> {
  const stay = await prisma.shortTermListing.findUnique({
    where: { id: stayId },
    select: { title: true, city: true, listingCode: true, nightPriceCents: true },
  });
  if (!stay) throw new Error("Stay not found");

  const nightly = (stay.nightPriceCents / 100).toFixed(0);
  const hook = `Best short-term stay · ${stay.city}`;
  const scenes = [
    mkScene("s1", "hero_image", durationTargetSec * 0.42, [stay.title.slice(0, 72), `${stay.city}`]),
    mkScene("s2", "pricing_card", durationTargetSec * 0.28, [`From ${nightly} CAD / night`, stay.listingCode]),
    mkScene("s3", "cta_card", durationTargetSec * 0.18, ["Book on LECIPM BNHub"]),
  ];

  return {
    templateKey: "bnhub_stay_spotlight",
    sourceKind: "bnhub_listing",
    sourceId: stayId,
    title: hook,
    hook,
    scenes,
    captions: scenes.flatMap((s) => s.overlayLines),
    cta: `Book · ${stay.listingCode}`,
    hashtags: uniqTags(["BNHub", "LECIPM", stay.city.replace(/\s+/g, "")]),
    suggestedCaption: sanitizeCaption(`${hook}\n\nCurated stays — transparent host tools on LECIPM.`),
    targetPlatform: "tiktok",
    durationTargetSec,
    complianceNotes: [],
    mediaWarning: null,
  };
}

export async function generateInvestorVideoScript(opportunityId: string, durationTargetSec: VideoDurationTarget = 30): Promise<VideoScriptVm> {
  const deal = await prisma.amfCapitalDeal.findUnique({
    where: { id: opportunityId },
    select: { title: true, allowsPublicMarketing: true },
  });
  if (!deal) throw new Error("Opportunity not found");

  const complianceNotes = [
    "Securities disclaimers apply — offers may be restricted to accredited investors.",
    "No ROI or performance guarantees.",
  ];

  const hook = deal.allowsPublicMarketing ? `Investment brief · ${deal.title.slice(0, 52)}` : `Private placement insight · ${deal.title.slice(0, 44)}`;

  const scenes = [
    mkScene("s1", "hero_image", durationTargetSec * 0.34, [deal.title.slice(0, 72)]),
    mkScene("s2", "details_card", durationTargetSec * 0.26, ["Due diligence-first", "Disclosures on platform"]),
    mkScene("s3", "cta_card", durationTargetSec * 0.26, ["LECIPM Investor Hub"]),
  ];

  return {
    templateKey: "investor_opportunity_brief",
    sourceKind: "investor_deal",
    sourceId: opportunityId,
    title: hook,
    hook,
    scenes,
    captions: scenes.flatMap((s) => s.overlayLines),
    cta: "Review disclosures before proceeding.",
    hashtags: uniqTags(["LECIPM", "PrivateMarkets"]),
    suggestedCaption: sanitizeCaption(
      `${hook}\n\nStructured capital workflows — eligibility and disclosures required.`,
    ),
    targetPlatform: "linkedin",
    durationTargetSec,
    complianceNotes,
    mediaWarning: null,
  };
}

export async function generateResidenceVideoScript(residenceId: string, durationTargetSec: VideoDurationTarget = 30): Promise<VideoScriptVm> {
  const r = await prisma.seniorResidence.findUnique({
    where: { id: residenceId },
    select: { name: true, city: true, province: true, careLevel: true },
  });
  if (!r) throw new Error("Residence not found");

  const hook = `Residence highlight · ${r.city}`;
  const scenes = [
    mkScene("s1", "hero_image", durationTargetSec * 0.4, [r.name.slice(0, 64), `${r.city}, ${r.province}`]),
    mkScene("s2", "area_spotlight", durationTargetSec * 0.28, [r.careLevel, "Explore lifestyle fit"]),
    mkScene("s3", "cta_card", durationTargetSec * 0.22, ["LECIPM Soins Hub"]),
  ];

  return {
    templateKey: "residence_services_highlight",
    sourceKind: "senior_residence",
    sourceId: residenceId,
    title: hook,
    hook,
    scenes,
    captions: scenes.flatMap((s) => s.overlayLines),
    cta: "Learn more on LECIPM.",
    hashtags: uniqTags(["SeniorLiving", "LECIPM", r.city]),
    suggestedCaption: sanitizeCaption(
      `${hook}\n\nInformational overview only — not medical advice. Verify services directly with operators.`,
    ),
    targetPlatform: "instagram_reels",
    durationTargetSec,
    complianceNotes: ["Not medical advice — informational marketing only.", "Avoid clinical outcome claims."],
    mediaWarning: null,
  };
}

export async function generateDealOfTheDayVideoScript(durationTargetSec: VideoDurationTarget = 15): Promise<VideoScriptVm | null> {
  const deal = await prisma.amfCapitalDeal.findFirst({
    where: { allowsPublicMarketing: true },
    orderBy: { updatedAt: "desc" },
    select: { id: true, title: true },
  });
  if (!deal) return null;
  const s = await generateInvestorVideoScript(deal.id, durationTargetSec);
  return {
    ...s,
    templateKey: "deal_of_the_day" as VideoTemplateKey,
    title: `Deal of the day · ${deal.title.slice(0, 48)}`,
    hook: `Deal focus · ${deal.title.slice(0, 52)}`,
  };
}

export async function generateTopFiveAreaVideoScript(city: string, durationTargetSec: VideoDurationTarget = 45): Promise<VideoScriptVm> {
  const rows = await prisma.fsboListing.findMany({
    where: { city: { equals: city, mode: "insensitive" }, status: "ACTIVE", archivedAt: null },
    orderBy: { priceCents: "desc" },
    take: 5,
    select: { title: true, listingCode: true },
  });

  const lines = rows.length
    ? rows.map((x, i) => `${i + 1}. ${x.title.slice(0, 48)}`)
    : ["Discover curated picks on LECIPM"];

  const hook = `Top 5 in ${city}`;
  const scenes = [
    mkScene("s1", "hero_image", durationTargetSec * 0.32, [hook]),
    mkScene("s2", "details_card", durationTargetSec * 0.38, lines.slice(0, 3)),
    mkScene("s3", "cta_card", durationTargetSec * 0.2, ["LECIPM Marketplace"]),
  ];

  return {
    templateKey: "top_5_listings_area",
    sourceKind: "aggregate",
    sourceId: null,
    title: hook,
    hook,
    scenes,
    captions: scenes.flatMap((s) => s.overlayLines),
    cta: "Browse listings on LECIPM.",
    hashtags: uniqTags(["TopListings", "LECIPM", city.replace(/\s+/g, "")]),
    suggestedCaption: sanitizeCaption(`${hook}\n\nRanked by seller inventory signals — verify details on listing pages.`),
    targetPlatform: "youtube_shorts",
    durationTargetSec,
    complianceNotes: [],
    mediaWarning: rows.length < 3 ? "Limited inventory in this city — shorter reel recommended." : null,
  };
}
