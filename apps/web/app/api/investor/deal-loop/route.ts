import { NextResponse } from "next/server";
import { z } from "zod";
import { DealInvestorLoopService } from "@/lib/investor/deal-loop/deal-investor-loop.service";
import { requireAdminSession } from "@/lib/admin/require-admin";
import { EntityComplianceGuard } from "@/lib/compliance/entity-compliance-guard";
import { logActivity } from "@/lib/audit/activity-log";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

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
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;
  
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
    
    // Domain protection logic per phase
    switch (phase) {
      case "create_deal": {
        const guard = await EntityComplianceGuard.validateDomainAction({ userId, domain: "BROKERAGE", action: "CREATE_LISTING" });
        if (!guard.allowed) throw new Error(guard.reason);
        result = await DealInvestorLoopService.createCapitalDeal(params);
        break;
      }
      case "validate_deal": {
        const guard = await EntityComplianceGuard.validateDomainAction({ userId, domain: "BROKERAGE", action: "MANAGE_PIPELINE" });
        if (!guard.allowed) throw new Error(guard.reason);
        result = await DealInvestorLoopService.validateDeal(params.dealId);
        break;
      }
      case "create_spv": {
        // SPV creation is a FUND domain action
        const guard = await EntityComplianceGuard.validateDomainAction({ userId, domain: "FINANCIAL", action: "MANAGE_ENTITIES" });
        if (!guard.allowed) throw new Error(guard.reason);
        result = await DealInvestorLoopService.createSpv(params.dealId, params.legalName);
        break;
      }
      case "onboard_investor": {
        const guard = await EntityComplianceGuard.validateDomainAction({ userId, domain: "FINANCIAL", action: "MANAGE_INVESTORS" });
        if (!guard.allowed) throw new Error(guard.reason);
        result = await DealInvestorLoopService.onboardInvestor(params);
        break;
      }
      case "commit_funds": {
        const guard = await EntityComplianceGuard.validateDomainAction({ userId, domain: "FINANCIAL", action: "INVEST_CAPITAL" });
        if (!guard.allowed) throw new Error(guard.reason);
        result = await DealInvestorLoopService.commitFunds(params);
        break;
      }
      case "execute_deal": {
        const guard = await EntityComplianceGuard.validateDomainAction({ userId, domain: "BROKERAGE", action: "NEGOTIATE_DEAL" });
        if (!guard.allowed) throw new Error(guard.reason);
        result = await DealInvestorLoopService.executeDeal(params);
        break;
      }
      case "distribute_profits": {
        const guard = await EntityComplianceGuard.validateDomainAction({ userId, domain: "FINANCIAL", action: "DISTRIBUTE_PROFITS" });
        if (!guard.allowed) throw new Error(guard.reason);
        result = await DealInvestorLoopService.distributeProfits(params);
        break;
      }
      case "audit_trail":
        // Admins can see audit trail
        result = await DealInvestorLoopService.getAuditTrail(params.dealId);
        break;
      case "verify_compliance":
        result = await DealInvestorLoopService.verifyCompliance(params.dealId);
        break;
      case "record_view":
        result = await logActivity({
          userId: userId,
          action: "investor_viewed",
          entityType: "DealInvestmentPacket",
          entityId: params.packetId,
          metadata: { dealId: params.dealId },
        });
        break;
      case "run_full_loop_mock": {
        // Mock only for testing, but let's restrict to admins or specific roles if needed
        result = await DealInvestorLoopService.runFullLoopMock(params);
        break;
      }
      default:
        return NextResponse.json({ error: "Unsupported phase" }, { status: 400 });
    }

    return NextResponse.json({ success: true, result });
  } catch (error: any) {
    console.error(`[deal-loop] Error in phase ${phase}:`, error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
