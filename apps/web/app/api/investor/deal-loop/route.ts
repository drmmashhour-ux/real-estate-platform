import { NextResponse } from "next/server";
import { z } from "zod";
import { DealInvestorLoopService } from "@/lib/investor/deal-loop/deal-investor-loop.service";
import { requireAdminSession } from "@/lib/admin/require-admin";

const bodySchema = z.object({
  phase: z.enum([
    "create_deal",
    "validate_deal",
    "create_spv",
    "onboard_investor",
    "commit_funds",
    "execute_deal",
    "distribute_profits",
    "audit_trail",
    "verify_compliance",
    "record_view",
    "run_full_loop_mock",
  ]),
  params: z.any(),
});

export async function POST(req: Request) {
  // In a real system, we'd check for appropriate roles (Broker, Investor, Admin)
  // For this implementation, we'll allow authenticated users.
  
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body", details: parsed.error.flatten() }, { status: 400 });
  }

  const { phase, params } = parsed.data;

  try {
    let result;
    switch (phase) {
      case "create_deal":
        result = await DealInvestorLoopService.createCapitalDeal(params);
        break;
      case "validate_deal":
        result = await DealInvestorLoopService.validateDeal(params.dealId);
        break;
      case "create_spv":
        result = await DealInvestorLoopService.createSpv(params.dealId, params.legalName);
        break;
      case "onboard_investor":
        result = await DealInvestorLoopService.onboardInvestor(params);
        break;
      case "commit_funds":
        result = await DealInvestorLoopService.commitFunds(params);
        break;
      case "execute_deal":
        result = await DealInvestorLoopService.executeDeal(params);
        break;
      case "distribute_profits":
        result = await DealInvestorLoopService.distributeProfits(params);
        break;
      case "audit_trail":
        result = await DealInvestorLoopService.getAuditTrail(params.dealId);
        break;
      case "verify_compliance":
        result = await DealInvestorLoopService.verifyCompliance(params.dealId);
        break;
      case "record_view":
        result = await logActivity({
          userId: params.userId,
          action: "investor_viewed",
          entityType: "DealInvestmentPacket",
          entityId: params.packetId,
          metadata: { dealId: params.dealId },
        });
        break;
      case "run_full_loop_mock":
        result = await DealInvestorLoopService.runFullLoopMock(params);
        break;
      default:
        return NextResponse.json({ error: "Unsupported phase" }, { status: 400 });
    }

    return NextResponse.json({ success: true, result });
  } catch (error: any) {
    console.error(`[deal-loop] Error in phase ${phase}:`, error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
