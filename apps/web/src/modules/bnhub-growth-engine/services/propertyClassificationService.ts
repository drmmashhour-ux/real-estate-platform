import { prisma } from "@/lib/db";

/** Capped extra points applied in “recommended” search sort from BNHUB star estimate. */
export const BNHUB_STAR_SEARCH_BOOST_CAP = 8;

export type ListingForClassification = {
  title?: string | null;
  description?: string | null;
  maxGuests?: number | null;
  beds?: number | null;
  bedrooms?: number | null;
  amenities?: unknown;
  safetyFeatures?: unknown;
  checkInInstructions?: string | null;
  instantBookEnabled?: boolean | null;
  cleaningFeeCents?: number | null;
  minStayNights?: number | null;
  maxStayNights?: number | null;
  neighborhoodDetails?: string | null;
  experienceTags?: unknown;
  servicesOffered?: unknown;
  photos?: unknown;
  /** URLs from `BnhubListingPhoto` when available (deduped with `photos` in scoring). */
  listingPhotoUrls?: string[];
};

export type {
  ClassificationBreakdown,
  ClassificationBreakdownCore,
} from "@/types/bnhub-classification-client";

function jsonStringArray(x: unknown): string[] {
  if (!Array.isArray(x)) return [];
  return x.filter((v): v is string => typeof v === "string").map((s) => s.toLowerCase());
}

function amenityBlob(listing: ListingForClassification): string {
  const a = jsonStringArray(listing.amenities);
  const s = jsonStringArray(listing.safetyFeatures);
  return [...a, ...s].join(" ");
}

function textBlob(listing: ListingForClassification): string {
  return `${listing.title ?? ""} ${listing.description ?? ""} ${listing.checkInInstructions ?? ""} ${listing.neighborhoodDetails ?? ""}`.toLowerCase();
}

function collectPhotoUrls(listing: ListingForClassification): string[] {
  const urls = new Set<string>();
  if (Array.isArray(listing.photos)) {
    for (const p of listing.photos) {
      if (typeof p === "string" && p.trim()) urls.add(p.trim());
    }
  }
  for (const u of listing.listingPhotoUrls ?? []) {
    if (typeof u === "string" && u.trim()) urls.add(u.trim());
  }
  return [...urls];
}

/**
 * Map 0–100 overall score to 1–5 stars (BNHUB estimate).
 */
export function convertScoreToStars(score: number): 1 | 2 | 3 | 4 | 5 {
  const s = Math.max(0, Math.min(100, Math.round(score)));
  if (s <= 30) return 1;
  if (s <= 50) return 2;
  if (s <= 70) return 3;
  if (s <= 85) return 4;
  return 5;
}

function matchAny(haystack: string, needles: string[]): boolean {
  return needles.some((n) => haystack.includes(n));
}

/**
 * Heuristic “AI-style” adjustment from wording / positioning (−5 … +5). No external API.
 */
export function computeAiAdjustment(listing: ListingForClassification): { value: number; signals: string[] } {
  const blob = `${listing.title ?? ""} ${listing.description ?? ""} ${listing.neighborhoodDetails ?? ""}`.toLowerCase();
  const signals: string[] = [];
  let raw = 0;

  const luxuryWords = [
    ["penthouse", 2],
    ["marble", 1],
    ["panoramic", 2],
    ["private pool", 2],
    ["wine cellar", 1],
    ["chef's kitchen", 1],
    ["estate", 1],
    ["villa", 1],
  ] as const;
  for (const [w, pts] of luxuryWords) {
    if (blob.includes(w)) {
      raw += pts;
      signals.push(`luxury_wording:${w}`);
    }
  }

  const locationWords = [
    ["waterfront", 2],
    ["oceanfront", 2],
    ["ski-in", 2],
    ["downtown", 1],
    ["old montreal", 2],
    ["plateau", 1],
    ["golden mile", 2],
  ] as const;
  for (const [w, pts] of locationWords) {
    if (blob.includes(w)) {
      raw += pts;
      signals.push(`premium_location:${w}`);
    }
  }

  const uniqueWords = [
    ["treehouse", 2],
    ["historic", 1],
    ["converted", 1],
    ["loft", 1],
    ["unique", 1],
    ["one-of-a-kind", 2],
  ] as const;
  for (const [w, pts] of uniqueWords) {
    if (blob.includes(w)) {
      raw += pts;
      signals.push(`uniqueness:${w}`);
    }
  }

  const negatives = [
    ["bare bones", -1],
    ["budget ", -1],
    ["basic unit", -1],
    ["no frills", -1],
    ["spartan", -1],
  ] as const;
  for (const [w, pts] of negatives) {
    if (blob.includes(w)) {
      raw += pts;
      signals.push(`value_positioning:${w}`);
    }
  }

  const value = Math.max(-5, Math.min(5, raw));
  return { value, signals };
}

function buildSuggestions(b: ClassificationBreakdownCore): string[] {
  const out: string[] = [];
  const a = b.amenities.items;
  if (!a.ac) out.push("Add air conditioning to your amenities if available.");
  if (!a.heating) out.push("List heating so guests know the space is comfortable year-round.");
  if (!a.wifi) out.push("Add Wi‑Fi to amenities — it is expected for short stays.");
  if (!a.kitchen) out.push("Highlight a full or kitchenette setup if you offer it.");
  if (!a.washer) out.push("Mention in-unit laundry or nearby laundry if applicable.");

  const c = b.comfort.items;
  if (!c.bedsAdequate) out.push("Add beds or lower max guests so sleeping capacity matches your listing.");
  if (!c.modernFurniture) out.push("Describe recent updates or quality furnishings in the description.");
  if (!c.cleanlinessSignal) out.push("Mention professional cleaning or housekeeping standards.");
  if (!c.spaceAdequacy) out.push("Clarify bedroom count and layout for your guest capacity.");

  const sv = b.services.items;
  if (!sv.selfCheckInOrSupport) out.push("Add self check-in details (smart lock, lockbox) or highlight responsive host support.");
  if (!sv.cleaningService) out.push("Offer or describe cleaning service / cleaning fee transparency.");
  if (!sv.longStay) out.push("Allow longer max stay for guests planning extended visits when possible.");

  const sf = b.safety.items;
  if (!sf.smokeDetector) out.push("List smoke / CO detectors under safety features.");
  if (!sf.secureLocks) out.push("Mention secure locks or smart entry in the listing.");
  if (!sf.safeNeighborhood) out.push("Add a short neighborhood note (safety, walkability) when comfortable.");

  const cp = b.completeness.items;
  if (!cp.fullDescription) out.push("Expand the description (aim for 200+ characters) with area and home details.");
  if (!cp.fivePhotos) out.push("Upload at least five quality photos including common spaces.");
  if (!cp.exteriorPhoto) out.push("Include an exterior, balcony, patio, or outdoor area photo if available.");

  const lx = b.luxury.items;
  if (!lx.premiumDesign) out.push("Highlight premium finishes or design in the description if accurate.");
  if (!lx.specialFeatures) out.push("Call out standout features: view, balcony, tub, or pool.");

  return [...new Set(out)].slice(0, 12);
}

/**
 * Deterministic 0–100 score from amenities, comfort, services, safety, completeness, luxury; then optional wording adjustment.
 */
export function computePropertyScore(listing: ListingForClassification): ClassificationBreakdown {
  const ab = amenityBlob(listing);
  const tb = textBlob(listing);
  const photoUrls = collectPhotoUrls(listing);
  const maxG = Math.max(1, listing.maxGuests ?? 4);
  const beds = Math.max(0, listing.beds ?? 0);
  const bedrooms = listing.bedrooms ?? null;

  const amenitiesItems = {
    ac: matchAny(ab, ["air condition", "air conditioning", "a/c", "hvac", "central air", "ductless", "mini split"]),
    heating: matchAny(ab, ["heat", "heating", "radiator", "fireplace"]),
    wifi: matchAny(ab, ["wifi", "wi-fi", "internet", "fibre", "fiber"]),
    kitchen: matchAny(ab, ["kitchen", "kitchenette"]),
    washer: matchAny(ab, ["washer", "washing machine", "laundry", "dryer"]),
  };
  const amenitiesEarned = Object.values(amenitiesItems).filter(Boolean).length * 5;

  const bedsAdequate = beds >= Math.ceil(maxG / 2) || (beds >= 1 && maxG <= 2);
  const modernFurniture = matchAny(tb, ["modern", "designer", "renovated", "updated", "stylish", "contemporary"]);
  const cleanlinessSignal = matchAny(tb, ["spotless", "pristine", "professionally cleaned", "hotel", "immaculate"]);
  const br = bedrooms ?? beds;
  const spaceAdequacy = br >= Math.min(4, Math.ceil(maxG / 2)) || (maxG <= 2 && br >= 1);

  const comfortItems = { bedsAdequate, modernFurniture, cleanlinessSignal, spaceAdequacy };
  const comfortEarned = Object.values(comfortItems).filter(Boolean).length * 5;

  const ci = (listing.checkInInstructions ?? "").toLowerCase();
  const selfCheckInOrSupport =
    listing.instantBookEnabled === true ||
    matchAny(ci, ["self", "keyless", "smart lock", "lockbox", "code", "keypad"]) ||
    matchAny(tb, ["self-check", "self check", "24/7 support", "always available"]);
  const servicesArr = jsonStringArray(listing.servicesOffered);
  const cleaningService =
    (listing.cleaningFeeCents != null && listing.cleaningFeeCents > 0) ||
    matchAny(servicesArr.join(" "), ["clean", "housekeep", "maid"]) ||
    matchAny(tb, ["cleaning included", "housekeeping", "mid-stay clean"]);
  const longStay =
    listing.maxStayNights == null ||
    listing.maxStayNights >= 14 ||
    (listing.minStayNights != null && listing.minStayNights >= 7);

  const servicesItems = { selfCheckInOrSupport, cleaningService, longStay };
  const servicesEarned = Object.values(servicesItems).filter(Boolean).length * 5;

  const smokeDetector = matchAny(ab, ["smoke", "carbon", "co detector", "fire alarm"]);
  const secureLocks = matchAny(ab + " " + tb, ["smart lock", "deadbolt", "keypad", "secure lock"]);
  const nd = (listing.neighborhoodDetails ?? "").toLowerCase();
  const safeNeighborhood =
    nd.length >= 40 ||
    matchAny(nd, ["quiet", "safe", "family", "residential", "walkable"]) ||
    matchAny(tb, ["quiet street", "safe neighborhood", "peaceful area"]);

  const safetyItems = { smokeDetector, secureLocks, safeNeighborhood };
  const safetyEarned = Object.values(safetyItems).filter(Boolean).length * 5;

  const descLen = (listing.description ?? "").trim().length;
  const fullDescription = descLen >= 200;
  const fivePhotos = photoUrls.length >= 5;
  const tags = jsonStringArray(listing.experienceTags);
  const exteriorPhoto =
    matchAny(tags.join(" "), ["exterior", "outdoor", "patio", "garden", "balcony", "terrace", "deck"]) ||
    matchAny(tb, ["balcony", "patio", "garden", "terrace", "rooftop", "outdoor space"]);

  const completenessItems = { fullDescription, fivePhotos, exteriorPhoto };
  const completenessEarned = Object.values(completenessItems).filter(Boolean).length * 5;

  const premiumDesign = matchAny(tb, ["luxury", "boutique", "designer", "high-end", "high end", "premium", "elegant"]);
  const specialFeatures =
    matchAny(ab + " " + tb, ["bathtub", "soaking tub", "jacuzzi", "hot tub", "ocean view", "mountain view", "city view", "balcony", "terrace", "pool", "private pool"]);

  const luxuryItems = { premiumDesign, specialFeatures };
  const luxuryEarned = Object.values(luxuryItems).filter(Boolean).length * 5;

  const baseScore = Math.min(
    100,
    amenitiesEarned + comfortEarned + servicesEarned + safetyEarned + completenessEarned + luxuryEarned
  );

  const ai = computeAiAdjustment(listing);
  const overallScore = Math.max(0, Math.min(100, baseScore + ai.value));
  const starRating = convertScoreToStars(overallScore);

  const core: ClassificationBreakdownCore = {
    label: "BNHUB Star Rating (internal platform estimate)",
    amenities: { earned: amenitiesEarned, max: 25, items: amenitiesItems },
    comfort: { earned: comfortEarned, max: 20, items: comfortItems },
    services: { earned: servicesEarned, max: 15, items: servicesItems },
    safety: { earned: safetyEarned, max: 15, items: safetyItems },
    completeness: { earned: completenessEarned, max: 15, items: completenessItems },
    luxury: { earned: luxuryEarned, max: 10, items: luxuryItems },
    aiAdjustment: { value: ai.value, signals: ai.signals },
    baseScore,
    overallScore,
    starRating,
  };

  return {
    ...core,
    improvementSuggestions: buildSuggestions(core),
  };
}

export function starRatingToSearchBoost(starRating: number): number {
  if (starRating < 1) return 0;
  return Math.min(BNHUB_STAR_SEARCH_BOOST_CAP, Math.max(0, starRating - 1) * 2);
}

/** 4★+ — eligible for premium growth / marketing campaign tiers (policy flag). */
export function isPremiumCampaignStarEligible(starRating: number): boolean {
  return starRating >= 4;
}

/** 5★ — luxury merchandising / homepage “luxury” category. */
export function isLuxuryCategoryStarEligible(starRating: number): boolean {
  return starRating >= 5;
}

export async function getClassificationSearchBoostMapForIds(
  listingIds: string[]
): Promise<Map<string, number>> {
  const map = new Map<string, number>();
  if (listingIds.length === 0) return map;
  const rows = await prisma.bnhubPropertyClassification.findMany({
    where: { listingId: { in: listingIds } },
    select: { listingId: true, starRating: true },
  });
  for (const r of rows) {
    map.set(r.listingId, starRatingToSearchBoost(r.starRating));
  }
  return map;
}

const CLASSIFICATION_RECOMPUTE_KEYS = new Set<string>([
  "amenities",
  "photos",
  "description",
  "title",
  "subtitle",
  "checkInInstructions",
  "checkInTime",
  "checkOutTime",
  "safetyFeatures",
  "neighborhoodDetails",
  "experienceTags",
  "servicesOffered",
  "maxStayNights",
  "minStayNights",
  "cleaningFeeCents",
  "instantBookEnabled",
  "beds",
  "bedrooms",
  "maxGuests",
  "houseRules",
  "accessibilityFeatures",
  "parkingDetails",
]);

export function shouldScheduleClassificationRecompute(data: Record<string, unknown>): boolean {
  return Object.keys(data).some((k) => CLASSIFICATION_RECOMPUTE_KEYS.has(k));
}

export async function recomputePropertyClassificationForListing(listingId: string): Promise<void> {
  const listing = await prisma.shortTermListing.findUnique({
    where: { id: listingId },
    select: {
      title: true,
      description: true,
      maxGuests: true,
      beds: true,
      bedrooms: true,
      amenities: true,
      safetyFeatures: true,
      checkInInstructions: true,
      instantBookEnabled: true,
      cleaningFeeCents: true,
      minStayNights: true,
      maxStayNights: true,
      neighborhoodDetails: true,
      experienceTags: true,
      servicesOffered: true,
      photos: true,
      listingPhotos: { select: { url: true } },
    },
  });
  if (!listing) return;

  const shaped: ListingForClassification = {
    ...listing,
    listingPhotoUrls: listing.listingPhotos.map((p) => p.url),
  };

  const breakdown = computePropertyScore(shaped);

  const ratingLabel = breakdown.label;

  await prisma.bnhubPropertyClassification.upsert({
    where: { listingId },
    create: {
      listingId,
      overallScore: breakdown.overallScore,
      starRating: breakdown.starRating,
      amenitiesScore: breakdown.amenities.earned,
      comfortScore: breakdown.comfort.earned,
      servicesScore: breakdown.services.earned,
      safetyScore: breakdown.safety.earned,
      completenessScore: breakdown.completeness.earned,
      luxuryScore: breakdown.luxury.earned,
      aiAdjustmentScore: breakdown.aiAdjustment.value,
      ratingLabel,
      breakdownJson: breakdown as unknown as object,
    },
    update: {
      overallScore: breakdown.overallScore,
      starRating: breakdown.starRating,
      amenitiesScore: breakdown.amenities.earned,
      comfortScore: breakdown.comfort.earned,
      servicesScore: breakdown.services.earned,
      safetyScore: breakdown.safety.earned,
      completenessScore: breakdown.completeness.earned,
      luxuryScore: breakdown.luxury.earned,
      aiAdjustmentScore: breakdown.aiAdjustment.value,
      ratingLabel,
      breakdownJson: breakdown as unknown as object,
      computedAt: new Date(),
    },
  });
}

/** @deprecated Prefer `scheduleBnhubListingEngineRefresh` (full suite). */
export function schedulePropertyClassificationRecompute(listingId: string, delayMs = 1600): void {
  void import("./bnhubListingEnginesOrchestrator").then((m) => {
    m.scheduleBnhubListingEngineRefresh(listingId, delayMs);
  });
}

export const computeAIAdjustment = computeAiAdjustment;

export function computeAmenitiesScore(listing: ListingForClassification) {
  const d = computePropertyScore(listing);
  return { score: d.amenities.earned, max: d.amenities.max, items: d.amenities.items };
}
export function computeComfortScore(listing: ListingForClassification) {
  const d = computePropertyScore(listing);
  return { score: d.comfort.earned, max: d.comfort.max, items: d.comfort.items };
}
export function computeServicesScore(listing: ListingForClassification) {
  const d = computePropertyScore(listing);
  return { score: d.services.earned, max: d.services.max, items: d.services.items };
}
export function computeSafetyScore(listing: ListingForClassification) {
  const d = computePropertyScore(listing);
  return { score: d.safety.earned, max: d.safety.max, items: d.safety.items };
}
export function computeCompletenessScore(listing: ListingForClassification) {
  const d = computePropertyScore(listing);
  return { score: d.completeness.earned, max: d.completeness.max, items: d.completeness.items };
}
export function computeLuxuryScore(listing: ListingForClassification) {
  const d = computePropertyScore(listing);
  return { score: d.luxury.earned, max: d.luxury.max, items: d.luxury.items };
}

export async function getPropertyClassification(listingId: string) {
  return prisma.bnhubPropertyClassification.findUnique({ where: { listingId } });
}

export async function upsertPropertyClassification(listingId: string): Promise<void> {
  await recomputePropertyClassificationForListing(listingId);
}

export function getImprovementSuggestions(listing: ListingForClassification): string[] {
  return computePropertyScore(listing).improvementSuggestions;
}
