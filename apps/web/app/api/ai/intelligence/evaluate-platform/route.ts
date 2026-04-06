import { NextRequest } from "next/server";
import { ListingStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requireAdminSession } from "@/lib/admin/require-admin";
import { evaluateListingForAutopilot } from "@/lib/ai/autopilot/evaluateListingForAutopilot";

export const dynamic = "force-dynamic";

/** POST — admin-only batch evaluation (optional limit via body). */
export async function POST(request: NextRequest) {
  const admin = await requireAdminSession();
  if (!admin.ok) {
    return Response.json({ error: admin.error }, { status: admin.status });
  }

  const body = (await request.json().catch(() => ({}))) as { limit?: number };
  const limit = typeof body.limit === "number" && body.limit > 0 ? Math.min(body.limit, 500) : 100;

  const listings = await prisma.shortTermListing.findMany({
    where: { listingStatus: ListingStatus.PUBLISHED },
    select: { id: true },
    take: limit,
    orderBy: { updatedAt: "desc" },
  });

  let ok = 0;
  for (const l of listings) {
    try {
      await evaluateListingForAutopilot(l.id);
      ok += 1;
    } catch {
      /* continue */
    }
  }

  return Response.json({ evaluated: ok, total: listings.length });
}
