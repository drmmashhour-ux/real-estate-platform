import { NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { isPlatformAdmin } from "@/lib/auth/is-platform-admin";
import { prisma } from "@repo/db";
import { isFsboPubliclyVisible } from "@/lib/fsbo/constants";
import { isDealAnalyzerEnabled, isDealAnalyzerPortfolioEnabled } from "@/modules/deal-analyzer/config";
import { getPortfolioOpportunitySummary } from "@/modules/deal-analyzer/application/getPortfolioOpportunitySummary";
import { portfolioStatusQuerySchema } from "@/modules/deal-analyzer/api/phase2Schemas";

export const dynamic = "force-dynamic";

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  if (!isDealAnalyzerEnabled() || !isDealAnalyzerPortfolioEnabled()) {
    return NextResponse.json({ error: "Deal Analyzer portfolio disabled" }, { status: 503 });
  }

  const { id } = await context.params;
  const userId = await getGuestId();
  const listing = await prisma.fsboListing.findUnique({
    where: { id },
    select: { ownerId: true, status: true, moderationStatus: true },
  });
  if (!listing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const isOwner = Boolean(userId && listing.ownerId === userId);
  const isAdmin = await isPlatformAdmin(userId);
  const publicOk = isFsboPubliclyVisible(listing);
  if (!isOwner && !isAdmin && !publicOk) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const url = new URL(request.url);
  const q = portfolioStatusQuerySchema.safeParse({
    compareIds: url.searchParams.get("compareIds") ?? undefined,
  });
  const raw = q.success ? q.data.compareIds : undefined;
  const compareIds = raw
    ? raw.split(",").map((s) => s.trim()).filter(Boolean)
    : [id];

  const unique = Array.from(new Set([id, ...compareIds])).slice(0, 48);

  const filters = url.searchParams.getAll("filter").map((s) => s.trim()).filter(Boolean);

  const out = await getPortfolioOpportunitySummary({ listingIds: unique, filters });
  if (!out.ok) {
    return NextResponse.json({ error: out.error }, { status: 503 });
  }

  const mine = out.ranked.find((r) => r.listingId === id);
  const rankIndex = mine ? out.ranked.indexOf(mine) + 1 : null;

  return NextResponse.json({
    listingId: id,
    rank: rankIndex,
    total: out.ranked.length,
    bucket: mine?.bucket ?? null,
    compositeScore: mine?.compositeScore ?? null,
    buckets: out.buckets,
    ranked: out.ranked,
  });
}
