import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { fsboCityWhereFromParam } from "@/lib/geo/city-search";
import type { DreamHomeProfile, DreamHomeMatchResult, DreamHomeMatchedListing } from "../types/dream-home.types";

const TAKE = 36;
const RETURN_TOP = 12;

function tokenize(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter((w) => w.length > 2),
  );
}

function keywordOverlap(listingText: string, keywords: string[]): number {
  if (keywords.length === 0) return 0;
  const t = tokenize(listingText);
  let hits = 0;
  for (const k of keywords) {
    for (const w of k.toLowerCase().split(/\s+/)) {
      if (w.length > 2 && t.has(w)) hits += 1;
    }
  }
  return hits / Math.max(1, keywords.length);
}

/**
 * Ranks public FSBO listings using profile filters + deterministic scoring (no LLM).
 */
export async function matchDreamHomeListings(
  profile: DreamHomeProfile,
  source: "ai" | "deterministic",
): Promise<DreamHomeMatchResult> {
  const f = profile.searchFilters;
  const and: Prisma.FsboListingWhereInput[] = [{ status: "ACTIVE" }, { moderationStatus: "APPROVED" }];

  if (f.city?.trim()) {
    and.push(fsboCityWhereFromParam(f.city.trim()));
  }
  if (f.maxBudget != null && Number.isFinite(f.maxBudget) && f.maxBudget > 0) {
    and.push({ priceCents: { lte: Math.floor(f.maxBudget * 100) } });
  }
  if (f.bedroomsMin != null && f.bedroomsMin > 0) {
    and.push({ bedrooms: { gte: f.bedroomsMin } });
  }
  if (f.bathroomsMin != null && f.bathroomsMin > 0) {
    and.push({ bathrooms: { gte: f.bathroomsMin } });
  }
  if (f.propertyType?.length) {
    and.push({
      OR: f.propertyType.map((p) => ({
        propertyType: { contains: p, mode: "insensitive" as const },
      })),
    });
  }

  const where: Prisma.FsboListingWhereInput = { AND: and };

  const rows = await prisma.fsboListing.findMany({
    where,
    take: TAKE,
    orderBy: [{ featuredUntil: { sort: "desc", nulls: "last" } }, { updatedAt: "desc" }],
    select: {
      id: true,
      title: true,
      city: true,
      priceCents: true,
      bedrooms: true,
      bathrooms: true,
      coverImage: true,
      propertyType: true,
      description: true,
    },
  });

  const kw = [...(f.keywords ?? []), ...(f.amenities ?? []), ...profile.propertyTraits.slice(0, 8)];

  const scored: DreamHomeMatchedListing[] = rows.map((r) => {
    const text = `${r.title} ${r.description}`;
    const ko = keywordOverlap(text, kw);
    const bed = r.bedrooms ?? 0;
    const bedTarget = f.bedroomsMin ?? 0;
    const bedPart = bedTarget > 0 ? 1 - Math.min(1, Math.abs(bed - bedTarget) / Math.max(1, bedTarget + 1)) : 0.5;
    const price = r.priceCents;
    const maxC = f.maxBudget != null ? f.maxBudget * 100 : null;
    const pricePart =
      maxC != null && maxC > 0 ? (price <= maxC ? 0.2 + 0.3 * (1 - price / maxC) : 0) : 0.25;
    const matchScore = Math.min(1, 0.35 * ko + 0.35 * bedPart + 0.3 * Math.max(0, pricePart));
    const why: string[] = [];
    if (bed >= (f.bedroomsMin ?? 0)) {
      why.push(`Bedroom count lines up with your ${f.bedroomsMin ?? "target"}+ preference.`);
    }
    if (ko > 0.15) {
      why.push("Description overlaps with traits and keywords from your profile.");
    }
    if (maxC != null && price <= maxC) {
      why.push("Listed within the budget you provided.");
    }
    if (why.length === 0) {
      why.push("Meets the filters you set; review photos and details to confirm fit.");
    }
    return {
      id: r.id,
      title: r.title,
      city: r.city,
      priceCents: r.priceCents,
      bedrooms: r.bedrooms,
      bathrooms: r.bathrooms,
      coverImage: r.coverImage,
      propertyType: r.propertyType,
      matchScore,
      whyThisFits: why.slice(0, 3),
    };
  });

  scored.sort((a, b) => b.matchScore - a.matchScore);
  const listings = scored.slice(0, RETURN_TOP);

  const tradeoffs: string[] = [
    "Matching uses your explicit filters and text overlap — it does not infer preferences from background.",
    f.maxBudget
      ? "Tighter budgets may exclude some desirable neighborhoods; consider radius or a slightly lower bedroom minimum."
      : "Add a max budget in the wizard to rank affordability more precisely.",
  ];
  if (listings.length === 0) {
    tradeoffs.push("No listings matched all filters — try widening city, budget, or bedroom/bathroom minimums.");
  }

  return { profile, listings, tradeoffs, source };
}
