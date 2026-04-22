import { prisma } from "@/lib/db";

import type { MarketingContentType, MarketingGeneratedContentVm, MarketingSocialPlatform } from "./marketing.types";

function tags(...xs: string[]) {
  return [...new Set(xs.map((x) => x.replace(/^#/, "").trim()).filter(Boolean))].slice(0, 12);
}

function pickPlatform(kind: MarketingContentType): MarketingSocialPlatform {
  if (kind === "bnhub_stay" || kind === "luxury_spotlight") return "instagram";
  if (kind === "investor_deal") return "linkedin";
  return "linkedin";
}

export async function generateListingPostFromFsbo(fsboId: string): Promise<MarketingGeneratedContentVm> {
  const f = await prisma.fsboListing.findUnique({
    where: { id: fsboId },
    select: {
      title: true,
      city: true,
      priceCents: true,
      listingCode: true,
      coverImage: true,
      images: true,
    },
  });
  if (!f) throw new Error("FSBO listing not found");
  const imgs = [f.coverImage, ...(f.images ?? [])].filter(Boolean).slice(0, 4) as string[];
  const price = (f.priceCents / 100).toLocaleString("en-CA");

  return {
    contentType: "listing_highlight",
    sourceKind: "fsbo_listing",
    sourceId: fsboId,
    title: `Featured home · ${f.city}`,
    caption: [`${f.title}`, `${f.city} · ${price} CAD`, "", "Seller Hub listing on LECIPM."].join("\n"),
    hashtags: tags("LECIPM", "HomeForSale", f.city.replace(/\s+/g, "")),
    mediaRefs: imgs,
    suggestedPlatform: "instagram",
    complianceNote: null,
  };
}

export async function generateListingPost(listingId: string): Promise<MarketingGeneratedContentVm> {
  const listing = await prisma.listing.findUnique({
    where: { id: listingId },
    select: { listingCode: true, title: true, price: true, titleFr: true },
  });
  if (!listing) {
    throw new Error("Listing not found");
  }
  const title = `Nouvelle inscription · ${listing.title.slice(0, 80)}`;
  const caption = [
    `${listing.title} — offered at ${listing.price.toLocaleString("en-CA", { maximumFractionDigits: 0 })} CAD.`,
    "",
    "Browse verified marketplace listings on LECIPM.",
    "",
    `#${listing.listingCode.replace(/[^a-zA-Z0-9]/g, "")}`,
  ].join("\n");

  return {
    contentType: "listing_highlight",
    sourceKind: "crm_listing",
    sourceId: listingId,
    title,
    caption,
    hashtags: tags("LECIPM", "Immobilier", "QuebecRealEstate", listing.listingCode),
    mediaRefs: [],
    suggestedPlatform: pickPlatform("listing_highlight"),
    complianceNote: null,
  };
}

export async function generateBNHubPost(listingId: string): Promise<MarketingGeneratedContentVm> {
  const stay = await prisma.shortTermListing.findUnique({
    where: { id: listingId },
    select: {
      title: true,
      city: true,
      listingCode: true,
      nightPriceCents: true,
      photos: true,
      listingPhotos: { select: { url: true, isCover: true }, orderBy: { sortOrder: "asc" }, take: 6 },
    },
  });
  if (!stay) throw new Error("BNHub listing not found");

  const photoUrls: string[] = [];
  const coverFirst = [...stay.listingPhotos].sort((a, b) => Number(b.isCover) - Number(a.isCover));
  for (const p of coverFirst) {
    photoUrls.push(p.url);
  }
  try {
    const parsed = stay.photos as unknown;
    if (Array.isArray(parsed)) {
      for (const p of parsed.slice(0, 3)) {
        if (typeof p === "string") photoUrls.push(p);
      }
    }
  } catch {
    /* ignore */
  }

  const nightly = (stay.nightPriceCents / 100).toFixed(0);
  const title = `Stay in ${stay.city} · ${stay.listingCode}`;
  const caption = [
    `${stay.title}`,
    `${stay.city} · from ${nightly} CAD / night`,
    "",
    "Book curated stays on LECIPM BNHub.",
  ].join("\n");

  return {
    contentType: "bnhub_stay",
    sourceKind: "bnhub_listing",
    sourceId: listingId,
    title,
    caption,
    hashtags: tags("BNHub", "LECIPM", stay.city.replace(/\s+/g, ""), "MontrealTravel"),
    mediaRefs: photoUrls.slice(0, 4),
    suggestedPlatform: "instagram",
    complianceNote: null,
  };
}

export async function generateInvestorPost(dealId: string): Promise<MarketingGeneratedContentVm> {
  const deal = await prisma.amfCapitalDeal.findUnique({
    where: { id: dealId },
    select: {
      title: true,
      allowsPublicMarketing: true,
      solicitationMode: true,
      status: true,
    },
  });
  if (!deal) throw new Error("Capital deal not found");

  const complianceNote = !deal.allowsPublicMarketing
    ? "Public marketing disabled for this deal — use accredited channels only."
    : null;

  const caption = [
    `${deal.title}`,
    "",
    deal.allowsPublicMarketing
      ? "Qualified investors can review materials on LECIPM (subject to eligibility)."
      : "Private placement — distribution restricted. Do not broadly solicit.",
    "",
    `#Investissement #LECIPM`,
  ].join("\n");

  return {
    contentType: "investor_deal",
    sourceKind: "investor_deal",
    sourceId: dealId,
    title: `Investor spotlight · ${deal.title.slice(0, 72)}`,
    caption,
    hashtags: tags("LECIPM", "Investissement", "PrivateMarkets"),
    mediaRefs: [],
    suggestedPlatform: "linkedin",
    complianceNote,
  };
}

export async function generateResidencePost(residenceId: string): Promise<MarketingGeneratedContentVm> {
  const r = await prisma.seniorResidence.findUnique({
    where: { id: residenceId },
    select: { name: true, city: true, province: true, careLevel: true },
  });
  if (!r) throw new Error("Residence not found");

  const caption = [
    `${r.name}`,
    `${r.city}, ${r.province} · ${r.careLevel}`,
    "",
    "Explore senior living options with LECIPM Soins Hub.",
  ].join("\n");

  return {
    contentType: "residence_spotlight",
    sourceKind: "residence",
    sourceId: residenceId,
    title: `Soins spotlight · ${r.name.slice(0, 64)}`,
    caption,
    hashtags: tags("SeniorLiving", "LECIPM", r.city.replace(/\s+/g, "")),
    mediaRefs: [],
    suggestedPlatform: "linkedin",
    complianceNote: null,
  };
}

/** Aggregate: top 5 CRM listings by demand analytics (best-effort). */
export async function generateTopFiveListingsPost(): Promise<MarketingGeneratedContentVm> {
  const rows = await prisma.listingAnalytics.findMany({
    where: { kind: "CRM" },
    orderBy: { demandScore: "desc" },
    take: 5,
    select: { listingId: true, demandScore: true },
  });
  const listings = await prisma.listing.findMany({
    where: { id: { in: rows.map((x) => x.listingId) } },
    select: { id: true, listingCode: true, title: true, price: true },
  });
  const lines = listings.map((l, i) => `${i + 1}. ${l.title.slice(0, 56)} · ${l.listingCode}`);
  const caption = ["Top picks on LECIPM this week 👇", "", ...lines, "", "Discover more on the marketplace."].join("\n");

  return {
    contentType: "top_5_listings",
    sourceKind: "aggregate",
    sourceId: null,
    title: "Top 5 listings · LECIPM picks",
    caption,
    hashtags: tags("TopListings", "LECIPM", "RealEstate"),
    mediaRefs: [],
    suggestedPlatform: "instagram",
    complianceNote: null,
  };
}

export async function generateDealOfTheDayPost(): Promise<MarketingGeneratedContentVm | null> {
  const deal = await prisma.amfCapitalDeal.findFirst({
    where: {
      allowsPublicMarketing: true,
    },
    orderBy: { updatedAt: "desc" },
    select: { id: true, title: true },
  });
  if (!deal) return null;
  const inner = await generateInvestorPost(deal.id);
  return {
    ...inner,
    contentType: "deal_of_the_day",
    title: `Deal focus · ${deal.title.slice(0, 56)}`,
  };
}

export async function generateLuxurySpotlightPost(): Promise<MarketingGeneratedContentVm> {
  const fsbo = await prisma.fsboListing.findFirst({
    where: { status: "ACTIVE", archivedAt: null },
    orderBy: { priceCents: "desc" },
    select: {
      id: true,
      title: true,
      city: true,
      priceCents: true,
      coverImage: true,
      images: true,
    },
  });
  if (!fsbo) {
    return generateTopFiveListingsPost().then((x) => ({ ...x, contentType: "luxury_spotlight" as MarketingContentType, title: "Luxury spotlight · LECIPM" }));
  }

  const imgs = [fsbo.coverImage, ...(fsbo.images ?? [])].filter(Boolean).slice(0, 4) as string[];
  const price = (fsbo.priceCents / 100).toLocaleString("en-CA");

  return {
    contentType: "luxury_spotlight",
    sourceKind: "fsbo_listing",
    sourceId: fsbo.id,
    title: `Luxury spotlight · ${fsbo.city}`,
    caption: [`${fsbo.title}`, `${fsbo.city} · ${price} CAD`, "", "Seller Hub listing on LECIPM."].join("\n"),
    hashtags: tags("LuxuryHomes", "LECIPM", fsbo.city.replace(/\s+/g, "")),
    mediaRefs: imgs,
    suggestedPlatform: "instagram",
    complianceNote: null,
  };
}

export async function generateNewThisWeekPost(): Promise<MarketingGeneratedContentVm> {
  const since = new Date(Date.now() - 7 * 86400000);
  const listings = await prisma.listing.findMany({
    where: { createdAt: { gte: since } },
    orderBy: { createdAt: "desc" },
    take: 5,
    select: { listingCode: true, title: true },
  });
  const caption =
    listings.length === 0
      ? ["Fresh inventory hits LECIPM weekly — save your search."].join("\n")
      : [
          "New this week on LECIPM ✨",
          "",
          ...listings.map((l) => `• ${l.title.slice(0, 64)} (${l.listingCode})`),
          "",
          "Browse the marketplace.",
        ].join("\n");

  return {
    contentType: "new_this_week",
    sourceKind: "aggregate",
    sourceId: null,
    title: "New listings this week",
    caption,
    hashtags: tags("NewListing", "LECIPM"),
    mediaRefs: [],
    suggestedPlatform: "linkedin",
    complianceNote: null,
  };
}
