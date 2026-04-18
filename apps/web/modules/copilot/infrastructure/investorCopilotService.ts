import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { fsboCityWhereFromParam } from "@/lib/geo/city-search";
import { rankInvestorPortfolio } from "@/modules/deal-analyzer/application/rankInvestorPortfolio";
import { isDealAnalyzerEnabled, isDealAnalyzerPortfolioEnabled } from "@/modules/deal-analyzer/config";
import { PortfolioBucket } from "@/modules/deal-analyzer/domain/portfolio";
import type { CopilotBlock, RankedDealItemDto } from "@/modules/copilot/domain/copilotTypes";
import { ensureDealAnalysesForListings } from "@/modules/copilot/infrastructure/ensureDealAnalyses";

const MAX_LISTINGS = 24;
/** Skip inventory that is clearly low-trust in the FSBO row (null = unknown, still ranked but deprioritized in filter pass). */
const MIN_LISTING_TRUST = 46;
const MAX_PER_CITY_FIRST_PASS = 2;
const OUTPUT_CAP = 12;

/**
 * Prefer geographic diversity while preserving score order: take up to `maxPerCity`
 * per city first, then backfill from the remainder so shortlists are not empty.
 */
function diversifyByCityOrdered(items: RankedDealItemDto[], maxPerCity: number, cap: number): RankedDealItemDto[] {
  const counts = new Map<string, number>();
  const chosen: RankedDealItemDto[] = [];
  const skipped: RankedDealItemDto[] = [];
  for (const it of items) {
    const key = (it.city || "?").toLowerCase();
    if ((counts.get(key) ?? 0) < maxPerCity) {
      counts.set(key, (counts.get(key) ?? 0) + 1);
      chosen.push(it);
    } else {
      skipped.push(it);
    }
  }
  for (const it of skipped) {
    if (chosen.length >= cap) break;
    chosen.push(it);
  }
  return chosen.slice(0, cap);
}

function filterInvestorCopilotNoise(items: RankedDealItemDto[]): RankedDealItemDto[] {
  return items.filter((it) => {
    if (it.bucket === PortfolioBucket.SPECULATIVE && it.compositeScore < 38) return false;
    return true;
  });
}

export async function runInvestorDealSearch(args: {
  cityRaw: string | null;
  maxPriceCents: number | null;
}): Promise<{ ok: true; block: CopilotBlock; summaryLine: string; usedDealAnalyzer: boolean } | { ok: false; error: string }> {
  if (!isDealAnalyzerEnabled() || !isDealAnalyzerPortfolioEnabled()) {
    return { ok: false, error: "Deal Analyzer portfolio ranking is required for this Copilot path." };
  }

  const and: Prisma.FsboListingWhereInput[] = [
    { status: "ACTIVE" },
    { moderationStatus: "APPROVED" },
    {
      OR: [{ trustScore: null }, { trustScore: { gte: MIN_LISTING_TRUST } }],
    },
  ];

  if (args.cityRaw?.trim()) {
    and.push(fsboCityWhereFromParam(args.cityRaw.trim()));
  }
  if (args.maxPriceCents != null && args.maxPriceCents > 0) {
    and.push({ priceCents: { lte: args.maxPriceCents } });
  }

  const where: Prisma.FsboListingWhereInput = { AND: and };

  const rows = await prisma.fsboListing.findMany({
    where,
    orderBy: { updatedAt: "desc" },
    take: MAX_LISTINGS,
    select: { id: true, title: true, city: true, priceCents: true },
  });

  if (rows.length === 0) {
    const note = !args.cityRaw && !args.maxPriceCents ? "Try naming a city or a max price (e.g. under $600k in Laval)." : "";
    return {
      ok: true,
      block: {
        type: "ranked_deals",
        items: [],
        queryNote: note || "No listings matched your filters.",
      },
      summaryLine: "No active listings matched — widen filters or check back later.",
      usedDealAnalyzer: false,
    };
  }

  const ids = rows.map((r) => r.id);
  const ensure = await ensureDealAnalysesForListings(ids);
  const ranked = await rankInvestorPortfolio({ listingIds: ids });
  if (!ranked.ok) {
    return { ok: false, error: ranked.error };
  }

  const meta = new Map(rows.map((r) => [r.id, r] as const));
  let items: RankedDealItemDto[] = ranked.ranked.map((r) => {
    const m = meta.get(r.listingId);
    const reasons = [...r.reasons.slice(0, 4), "Not investment advice — verify with your own diligence."];
    return {
      listingId: r.listingId,
      title: m?.title ?? "Listing",
      city: m?.city ?? "",
      priceCents: m?.priceCents ?? 0,
      compositeScore: r.compositeScore,
      bucket: r.bucket,
      reasons,
    };
  });

  const noiseFiltered = filterInvestorCopilotNoise(items);
  items = noiseFiltered.length > 0 ? noiseFiltered : items;
  items = diversifyByCityOrdered(items, MAX_PER_CITY_FIRST_PASS, OUTPUT_CAP);

  const parts: string[] = [];
  if (args.cityRaw) parts.push(`city ${args.cityRaw}`);
  if (args.maxPriceCents != null) parts.push(`max price ~$${Math.round(args.maxPriceCents / 100).toLocaleString()}`);
  const queryNote = [
    parts.length ? `Filters: ${parts.join(", ")}.` : "",
    !args.cityRaw?.trim() && (args.maxPriceCents == null || args.maxPriceCents <= 0)
      ? "Add a city or max price in your message to sharpen results."
      : "",
    parts.length === 0 ? "Broad catalog — scores use on-platform listing + analyzer data only." : "",
    ensure.ran > 0 ? `Filled ${ensure.ran} missing analyzer snapshot(s).` : "",
  ]
    .filter(Boolean)
    .join(" ")
    .trim() || "Active FSBO inventory with minimum trust on the listing row.";

  const summaryLine = `Ranked ${items.length} listing snapshot(s) with deterministic Deal Analyzer scores — advisory only, not investment advice.`;

  return {
    ok: true,
    block: { type: "ranked_deals", items, queryNote },
    summaryLine,
    usedDealAnalyzer: true,
  };
}
