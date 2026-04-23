import { NextResponse } from "next/server";
import { prisma } from "@repo/db";
import { requireMortgageExpertWithTerms } from "@/modules/mortgage/services/expert-guard";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await requireMortgageExpertWithTerms();
  if ("error" in session) return session.error;
  const { expert, userId } = session;

  await prisma.mortgageExpert
    .update({
      where: { id: expert.id },
      data: { dashboardLastSeenAt: new Date() },
    })
    .catch(() => {});

  const leads = await prisma.lead.findMany({
    where: { assignedExpertId: expert.id, leadType: "mortgage" },
    orderBy: { createdAt: "desc" },
    take: 200,
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      message: true,
      pipelineStatus: true,
      pipelineStage: true,
      score: true,
      createdAt: true,
      mortgageInquiry: true,
      highIntent: true,
      source: true,
      campaign: true,
      medium: true,
      revenueTier: true,
      mortgageCreditCost: true,
      estimatedValue: true,
      conversionProbability: true,
      purchaseRegion: true,
      lastContactedAt: true,
      mortgageAssignedAt: true,
      mortgageDeal: {
        select: {
          id: true,
          dealAmount: true,
          platformShare: true,
          expertShare: true,
          status: true,
        },
      },
    },
  });

  return NextResponse.json({ leads });
}
