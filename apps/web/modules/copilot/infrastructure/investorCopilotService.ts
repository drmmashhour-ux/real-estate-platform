import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { fsboCityWhereFromParam } from "@/lib/geo/city-search";
import { rankInvestorPortfolio } from "@/modules/deal-analyzer/application/rankInvestorPortfolio";
import { isDealAnalyzerEnabled, isDealAnalyzerPortfolioEnabled } from "@/modules/deal-analyzer/config";
import type { CopilotBlock, RankedDealItemDto } from "@/modules/copilot/domain/copilotTypes";
import { ensureDealAnalysesForListings } from "@/modules/copilot/infrastructure/ensureDealAnalyses";

const MAX_LISTINGS = 20;

export async function runInvestorDealSearch(args: {
  cityRaw: string | null;
  maxPriceCents: number | null;
}): Promise<{ ok: true; block: CopilotBlock; summaryLine: string; usedDealAnalyzer: boolean } | { ok: false; error: string }> {
  if (!isDealAnalyzerEnabled() || !isDealAnalyzerPortfolioEnabled()) {
    return { ok: false, error: "Deal Analyzer portfolio ranking is required for this Copilot path." };
  }

  const and: Prisma.FsboListingWhereInput[] = [{ status: "ACTIVE" }, { moderationStatus: "APPROVED" }];

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
  const items: RankedDealItemDto[] = ranked.ranked.map((r) => {
    const m = meta.get(r.listingId);
    return {
      listingId: r.listingId,
      title: m?.title ?? "Listing",
      city: m?.city ?? "",
      priceCents: m?.priceCents ?? 0,
      compositeScore: r.compositeScore,
      bucket: r.bucket,
      reasons: r.reasons.slice(0, 6),
    };
  });

  const parts: string[] = [];
  if (args.cityRaw) parts.push(`city ${args.cityRaw}`);
  if (args.maxPriceCents != null) parts.push(`max price ~$${Math.round(args.maxPriceCents / 100).toLocaleString()}`);
  const queryNote = [
    parts.length ? `Filters: ${parts.join(", ")}.` : "Filters: broad catalog (add filters in your message).",
    ensure.ran > 0 ? ` Ran ${ensure.ran} deterministic analysis run(s) to fill missing scores.` : "",
  ]
    .filter(Boolean)
    .join(" ");

  const summaryLine = `Ranked ${items.length} opportunity snapshot(s) using deterministic Deal Analyzer scores (not investment advice).`;

  return {
    ok: true,
    block: { type: "ranked_deals", items, queryNote },
    summaryLine,
    usedDealAnalyzer: true,
  };
}
