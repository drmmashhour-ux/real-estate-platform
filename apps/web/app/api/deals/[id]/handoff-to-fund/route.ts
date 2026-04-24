import { NextResponse } from "next/server";
import { z } from "zod";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { requireActiveResidentialBrokerLicence } from "@/lib/compliance/oaciq/broker-licence-guard";
import { DealInvestorBridgeService } from "@/lib/compliance/deal-investor-bridge.service";

const bodySchema = z.object({
  summary: z.string(),
  underwritingRecommendation: z.string().optional(),
  risks: z.string(),
  financialProjection: z.string().optional(),
  esgRetrofitSnapshot: z.string().optional(),
  financingSnapshot: z.string().optional(),
  committeeStatus: z.string().optional(),
  complianceBlockers: z.string().optional(),
  esgScore: z.number().optional(),
});

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const userId = await getGuestId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const dealId = params.id;

  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body", details: parsed.error.flatten() }, { status: 400 });
  }

  const capital = await prisma.amfCapitalDeal.findUnique({
    where: { id: dealId },
    select: { id: true, sponsorUserId: true },
  });
  if (!capital) {
    return NextResponse.json({ error: "Capital deal not found" }, { status: 404 });
  }

  const assignedBrokerId = capital.sponsorUserId ?? userId;
  const licenceBlock = await requireActiveResidentialBrokerLicence(userId, {
    transactionType: "investor_deal",
    assignedBrokerId,
    actorBrokerId: userId,
  });
  if (licenceBlock) return licenceBlock;

  try {
    const packet = await DealInvestorBridgeService.createHandoffPackage({
      brokerUserId: userId,
      dealId,
      ...parsed.data,
    });
    return NextResponse.json({ success: true, packet });
  } catch (error: any) {
    console.error("[handoff-to-fund] Error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
