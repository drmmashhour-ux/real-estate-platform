import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { RegulatoryGuardService } from "@/lib/compliance/regulatory-guard.service";
import { logActivity } from "@/lib/audit/activity-log";

const bodySchema = z.object({
  summary: z.string(),
  price: z.number(),
  risks: z.string(),
  projections: z.string(),
  legalEntityName: z.string(),
});

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const dealId = params.id;
  
  // In a real system, we'd get this from the session
  const authUserId = req.headers.get("x-user-id"); 
  if (!authUserId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // PHASE 3: Validate broker
  const regCheck = await RegulatoryGuardService.validateAction(authUserId, "CREATE_LISTING");
  if (!regCheck.allowed) {
    return NextResponse.json({ error: regCheck.reason }, { status: 403 });
  }

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

  const data = parsed.data;

  try {
    const result = await prisma.$transaction(async (tx) => {
      // 1. Ensure AmfCapitalDeal exists
      const deal = await tx.amfCapitalDeal.findUnique({ where: { id: dealId } });
      if (!deal) throw new Error("Deal not found.");

      // 2. Create Investment Packet (PHASE 2)
      const packet = await tx.dealInvestmentPacket.create({
        data: {
          capitalDealId: dealId,
          summary: data.summary,
          price: data.price,
          risks: data.risks,
          projections: data.projections,
          createdByBrokerId: authUserId,
        },
      });

      // 3. Ensure SPV exists or create it (PHASE 1)
      const spv = await tx.lecipmCorporateEntity.upsert({
        where: { capitalDealId: dealId },
        update: { legalName: data.legalEntityName },
        create: {
          capitalDealId: dealId,
          legalName: data.legalEntityName,
          entityType: "SPV",
          jurisdiction: "QC",
        },
      });

      return { packet, spv };
    });

    // PHASE 8: AUDIT
    await logActivity({
      userId: authUserId,
      action: "packet_created",
      entityType: "DealInvestmentPacket",
      entityId: result.packet.id,
      metadata: { dealId },
    });

    return NextResponse.json({ success: true, ...result });
  } catch (error: any) {
    console.error("[to-investment] Error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
