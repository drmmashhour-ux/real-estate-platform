import { NextResponse } from "next/server";
import { prisma } from "@repo/db";
import { requireMortgageExpertWithTerms } from "@/modules/mortgage/services/expert-guard";

export const dynamic = "force-dynamic";

/** GET unclaimed mortgage marketplace leads */
export async function GET() {
  const session = await requireMortgageExpertWithTerms();
  if ("error" in session) return session.error;

  const leads = await prisma.lead.findMany({
    where: {
      leadType: "mortgage",
      mortgageMarketplaceStatus: "open",
      assignedExpertId: null,
    },
    orderBy: { createdAt: "asc" },
    take: 100,
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      message: true,
      pipelineStatus: true,
      createdAt: true,
      mortgageInquiry: true,
      revenueTier: true,
      mortgageCreditCost: true,
      dynamicLeadPriceCents: true,
      purchaseRegion: true,
    },
  });

  return NextResponse.json({ leads });
}
