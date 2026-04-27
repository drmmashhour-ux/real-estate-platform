import { NextResponse } from "next/server";
import { query } from "@/lib/sql";
import { getGuestId } from "@/lib/auth/session";
import { getListingsDB } from "@/lib/db";

export const dynamic = "force-dynamic";

type ListingOptimizationRow = {
  id: string;
  listingId: string;
  suggestions: unknown;
  createdAt: Date;
  applied: boolean;
};

type Ctx = { params: Promise<{ listingId: string }> };

/**
 * GET /api/ai/suggestions/crm/[listingId] — latest `ListingOptimization` rows (host must own the listing).
 */
export async function GET(_req: Request, context: Ctx) {
  const userId = await getGuestId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { listingId } = await context.params;
  if (!listingId) {
    return NextResponse.json({ error: "listingId is required" }, { status: 400 });
  }

  const row = await getListingsDB().listing.findFirst({
    where: { id: listingId, userId },
    select: { id: true },
  });
  if (!row) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const sql = `
    SELECT * FROM "ListingOptimization"
    WHERE "listingId" = $1
    ORDER BY "createdAt" DESC
    LIMIT 10
  `.trim();
  const rows = await query<ListingOptimizationRow>(sql, [listingId]);
  return NextResponse.json(rows);
}
