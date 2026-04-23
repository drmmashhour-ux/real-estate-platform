import { NextResponse } from "next/server";
import { prisma } from "@repo/db";
import { requireAdminSession } from "@/lib/admin/require-admin";
import { publishLeadToMarketplace } from "@/modules/lead-marketplace/application/publishLeadToMarketplace";

export const dynamic = "force-dynamic";

/**
 * POST /api/lead-marketplace/publish — admin: list a lead on the marketplace with dynamic pricing.
 */
export async function POST(req: Request) {
  const admin = await requireAdminSession();
  if (!admin.ok) return NextResponse.json({ error: admin.error }, { status: admin.status });

  const body = await req.json().catch(() => ({}));
  const leadId = typeof body.leadId === "string" ? body.leadId : "";
  if (!leadId) return NextResponse.json({ error: "leadId required" }, { status: 400 });

  const result = await publishLeadToMarketplace(prisma, leadId);
  if (!result.ok) {
    return NextResponse.json({ error: result.reason }, { status: 400 });
  }

  return NextResponse.json({
    marketplaceListingId: result.marketplaceListingId,
    priceCents: result.priceCents,
    score: result.score,
  });
}
