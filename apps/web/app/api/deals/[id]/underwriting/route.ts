import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { withDomainProtection } from "@/lib/compliance/domain-protection";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  
  return withDomainProtection({
    domain: "BROKERAGE",
    action: "VIEW_ANALYTICS",
    entityId: id,
    handler: async (userId) => {
      const deal = await prisma.investmentPipelineDeal.findUnique({
        where: { id },
        select: {
          underwritingScore: true,
          underwritingLabel: true,
          underwritingRecommendation: true,
          underwritingConfidence: true,
          underwritingSummaryJson: true,
          underwritingRisksJson: true,
          underwritingUpsideJson: true,
          underwritingUpdatedAt: true,
          underwritingSnapshots: {
            orderBy: { createdAt: "desc" },
            take: 5
          }
        }
      });

      if (!deal) {
        return NextResponse.json({ error: "Deal not found" }, { status: 404 });
      }

      return NextResponse.json({ ok: true, underwriting: deal });
    }
  });
}
