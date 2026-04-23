import { NextResponse } from "next/server";
import { prisma } from "@repo/db";
import { requireRole } from "@/lib/auth/require-role";
import { requireBnhubInvestorPortalAccessApi } from "@/modules/investor/auth/require-bnhub-investor-portal-api";
import { investorMayAccessListingRecommendation } from "@/modules/investment/investor-recommendation-access.service";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

/** POST — admin, or BNHub investor for recommendations on their own listings. */
export async function POST(_req: Request, context: RouteContext) {
  const { id } = await context.params;

  const admin = await requireRole("admin");
  let actor: "admin" | "investor" = "admin";
  if (!admin.ok) {
    const gate = await requireBnhubInvestorPortalAccessApi();
    if (!gate.ok) return gate.response;
    const allowed = await investorMayAccessListingRecommendation(gate.investor, id);
    if (!allowed) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    actor = "investor";
  }

  const row = await prisma.investmentRecommendation.update({
    where: { id },
    data: { status: "dismissed" },
  });

  await prisma.investmentRecommendationLog.create({
    data: {
      recommendationId: row.id,
      actionType: "dismissed",
      message:
        actor === "admin"
          ? "Recommendation dismissed by administrator."
          : "Recommendation dismissed by investor.",
    },
  });

  return NextResponse.json({ success: true, row });
}
