import { NextRequest, NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/admin/require-admin";
import { getRankedListings } from "@/src/modules/ranking/rankingService";
import type { RankingListingType } from "@/src/modules/ranking/dataMap";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const auth = await requireAdminSession();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const sp = request.nextUrl.searchParams;
  const listingType = (sp.get("listingType") ?? "bnhub") as RankingListingType;
  const city = sp.get("city") ?? undefined;
  const take = parseInt(sp.get("take") ?? "40", 10) || 40;
  const listingId = sp.get("listingId")?.trim();

  if (listingId) {
    const { prisma } = await import("@/lib/db");
    const row = await prisma.listingRankingScore.findUnique({
      where: { listingType_listingId: { listingType, listingId } },
    });
    return NextResponse.json({ score: row });
  }

  const rows = await getRankedListings({ listingType, city, take });
  return NextResponse.json({ listings: rows });
}
