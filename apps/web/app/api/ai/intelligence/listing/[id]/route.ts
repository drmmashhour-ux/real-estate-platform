import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

/** Latest unified intelligence snapshot for a BNHub stay listing. */
export async function GET(_request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const listingId = typeof id === "string" ? id.trim() : "";
  if (!listingId) {
    return Response.json({ error: "listing id required" }, { status: 400 });
  }

  const snap = await prisma.listingIntelligenceSnapshot.findFirst({
    where: { listingId },
    orderBy: { createdAt: "desc" },
  });

  if (!snap) {
    return Response.json({ snapshot: null });
  }

  return Response.json({ snapshot: snap });
}
