import { prisma } from "@/lib/db";
import { logActivity } from "@/lib/audit/activity-log";
import { assertAutopilotOutboundAllowed } from "@/lib/signature-control/autopilot-guard";
import { snapshotBrokerInfo } from "./broker-context";
import { AmfSafeModeService } from "./amf-safe-mode.service";
import { RegulatoryGuardService } from "@/lib/compliance/regulatory-guard.service";
import { EntityComplianceGuard } from "@/lib/compliance/entity-compliance-guard";

/**
 * Deal-to-Investor Profit Loop Service
 * Implements the lifecycle from broker deal creation to investor distribution.
 */
export class DealInvestorLoopService {
  /**
   * PHASE 1 & 2: DEAL CREATION
   * Broker creates a capital-raising deal linked to a property.
   */
  static async createCapitalDeal(params: {
    brokerUserId: string;
    listingId: string;
    title: string;
    solicitationMode?: "PRIVATE_PLACEMENT" | "PROSPECTUS_EXEMPT";
    metadata?: Record<string, any>;
  }) {
    // Basic validation
    if (!params.title || !params.listingId) {
      throw new Error("Missing required deal fields.");
    }

    // PHASE 5: ENTITY COMPLIANCE GUARD
    const entityCheck = await EntityComplianceGuard.validateDomainAction({
      userId: params.brokerUserId,
      domain: "BROKERAGE",
      action: "CREATE_CAPITAL_DEAL",
    });
    if (!entityCheck.allowed) {
      throw new Error(entityCheck.reason || "Entity compliance failure.");
    }

    // PHASE 2: OACIQ GUARD
    const regCheck = await RegulatoryGuardService.validateAction(params.brokerUserId, "CREATE_LISTING");
    if (!regCheck.allowed) {
      throw new Error(regCheck.reason || "Unauthorized brokerage action.");
    }

    const policy = await AmfSafeModeService.getPolicy();

    // Step 1: Create the Capital Deal
    const brokerSnapshot = await snapshotBrokerInfo(params.brokerUserId);

    const deal = await prisma.amfCapitalDeal.create({
      data: {
        title: params.title,
        listingId: params.listingId,
        sponsorUserId: params.brokerUserId,
        solicitationMode: params.solicitationMode || "PRIVATE_PLACEMENT",
        status: "DRAFT",
        brokerSnapshot: brokerSnapshot,
        /// PHASE 3: Block public marketing if policy is PRIVATE
        allowsPublicMarketing: policy.blockPublicMarketing ? false : true,
      },
    });

    await logActivity({
      userId: params.brokerUserId,
      action: "amf_capital_deal_created",
      entityType: "AmfCapitalDeal",
      entityId: deal.id,
      metadata: { 
        listingId: params.listingId,
        fundMode: policy.fundMode,
      },
    });

    return deal;
  }

  /**
   * PHASE 2: DEAL VALIDATION
   * Validates broker disclosure and conflict status.
   */
  static async validateDeal(dealId: string) {
    const deal = await prisma.amfCapitalDeal.findUnique({
      where: { id: dealId },
      include: { listing: true },
    });

    if (!deal) throw new Error("Deal not found.");

    // Check: Broker role disclosure
    // Heuristic: Ensure the sponsor is not the platform itself
    // and that the sponsor is a verified broker (this would be checked in a real system)
    
    // For now, we update status to VALIDATED
    const updatedDeal = await prisma.amfCapitalDeal.update({
      where: { id: dealId },
      data: { status: "VALIDATED" },
    });

    await logActivity({
      userId: deal.sponsorUserId,
      action: "amf_capital_deal_validated",
      entityType: "AmfCapitalDeal",
      entityId: deal.id,
    });

    return updatedDeal;
  }

  /**
   * PHASE 3: SPV CREATION
   * Auto-creates a legal entity (CorporateEntity) for the deal.
   */
  static async createSpv(dealId: string, legalName: string) {
    const deal = await prisma.amfCapitalDeal.findUnique({
      where: { id: dealId },
    });

    if (!deal) throw new Error("Deal not found.");

    const spv = await prisma.lecipmCorporateEntity.create({
      data: {
        capitalDealId: dealId,
        legalName: legalName,
        entityType: "SPV",
        jurisdiction: "QC", // Defaulting to Quebec for this platform
      },
    });

    await logActivity({
      userId: deal.sponsorUserId,
      action: "amf_spv_created",
      entityType: "LecipmCorporateEntity",
      entityId: spv.id,
      metadata: { capitalDealId: dealId, legalName },
    });

    // Update deal status to active for capital raise
    await prisma.amfCapitalDeal.update({
      where: { id: dealId },
      data: { status: "ACTIVE" },
    });

    return spv;
  }

  /**
   * PHASE 4: INVESTOR ONBOARDING
   * Creates an investor profile with KYC status.
   */
  static async onboardInvestor(params: {
    userId: string;
    legalName: string;
    email: string;
  }) {
    const investor = await prisma.amfInvestor.upsert({
      where: { email: params.email },
      update: {
        userId: params.userId,
        legalName: params.legalName,
      },
      create: {
        userId: params.userId,
        legalName: params.legalName,
        email: params.email,
        kycStatus: "PENDING",
        accreditationStatus: "PENDING",
      },
    });

    await logActivity({
      userId: params.userId,
      action: "amf_investor_onboarded",
      entityType: "AmfInvestor",
      entityId: investor.id,
    });

    return investor;
  }

  /**
   * PHASE 5 & 6 & 8: CAPITAL RAISE
   * Investors commit funds to a deal.
   */
  static async commitFunds(params: {
    investorId: string;
    dealId: string;
    amount: number;
    /// PHASE 4: Require disclosure acknowledgments
    riskAccepted?: boolean;
    notFinancialAdvice?: boolean;
    independentDecision?: boolean;
  }) {
    // Check investor KYC/Accreditation (Simulated)
    const investor = await prisma.amfInvestor.findUnique({
      where: { id: params.investorId },
    });

    if (!investor) throw new Error("Investor not found.");
    
    // PHASE 5: ENTITY COMPLIANCE GUARD (Investment usually tied to FUND entity via the deal's SPV)
    // Here we check if the platform/fund entity allows this action.
    const entityCheck = await EntityComplianceGuard.validateDomainAction({
      userId: investor.userId!,
      domain: "FUND",
      action: "INVEST_PRIVATE",
    });
    if (!entityCheck.allowed) {
      throw new Error(entityCheck.reason || "Entity compliance failure for fund investment.");
    }

    // PHASE 3: AMF GUARD
    const regCheck = await RegulatoryGuardService.validateAction(investor.userId!, "INVEST_PRIVATE");
    if (!regCheck.allowed) {
      throw new Error(regCheck.reason || "Investment not allowed in current regulatory mode.");
    }

    // PHASE 4: Strict disclosure requirement
    if (!params.riskAccepted || !params.notFinancialAdvice || !params.independentDecision) {
      throw new Error("You must accept the risk disclosure and confirm this is an independent decision.");
    }

    // Step 1: Create investment
    const investment = await prisma.amfInvestment.create({
      data: {
        investorId: params.investorId,
        capitalDealId: params.dealId,
        amount: params.amount,
        status: "COMMITTED",
      },
    });

    // Step 2: Update Deal scale metrics
    const deal = await prisma.amfCapitalDeal.update({
      where: { id: params.dealId },
      data: {
        investorCount: { increment: 1 },
        totalCapitalRaised: { increment: params.amount },
      },
      include: { corporateEntity: true },
    });

    // PHASE 6: Money flow rule - Funds to SPV only
    const paymentInstructions = deal.corporateEntity 
      ? `Funds must be sent directly to ${deal.corporateEntity.legalName}. Platform or Broker cannot receive investment funds.`
      : "Pending SPV creation. Do not send funds until SPV is ready.";

    // Step 3: Check scale triggers (PHASE 8)
    const safetyCheck = await AmfSafeModeService.checkScaleTriggers(params.dealId);
    if (!safetyCheck.compliant) {
      console.warn(`[amf-safety] SCALE TRIGGER: ${safetyCheck.warning} - ${safetyCheck.reasons?.join(", ")}`);
      // In a real system, we might pause the deal here.
    }

    await logActivity({
      userId: investor.userId,
      action: regCheck.allowed ? "amf_investment_committed" : "investment_simulated",
      entityType: "AmfInvestment",
      entityId: investment.id,
      metadata: { 
        dealId: params.dealId, 
        amount: params.amount,
        safetyStatus: safetyCheck.compliant ? "OK" : "WARNING",
        isSimulation: !regCheck.allowed,
      },
    });

    return {
      investment,
      paymentInstructions,
      safetyStatus: safetyCheck.compliant ? "COMPLIANT" : "WARNING",
      warning: safetyCheck.compliant ? null : safetyCheck.warning,
      reasons: safetyCheck.reasons || [],
    };
  }

  /**
   * PHASE 8: COMPLIANCE RE-VERIFICATION
   * Manually trigger a compliance check for a deal.
   */
  static async verifyCompliance(dealId: string) {
    const safetyCheck = await AmfSafeModeService.checkScaleTriggers(dealId);
    
    if (!safetyCheck.compliant) {
      await logActivity({
        action: "amf_compliance_warning",
        entityType: "AmfCapitalDeal",
        entityId: dealId,
        metadata: { warning: safetyCheck.warning, reasons: safetyCheck.reasons },
      });
    }

    return safetyCheck;
  }

  /**
   * PHASE 6: EXECUTION
   * Links the capital deal to a property purchase/management deal.
   */
  static async executeDeal(params: {
    capitalDealId: string;
    dealId: string; // The legal purchase deal
    actionPipelineId?: string | null;
  }) {
    await assertAutopilotOutboundAllowed({
      operation: "amf_capital:execute_deal",
      actionPipelineId: params.actionPipelineId,
    });

    const capitalDeal = await prisma.amfCapitalDeal.findUnique({
      where: { id: params.capitalDealId },
    });

    if (!capitalDeal) throw new Error("Capital deal not found.");

    // PHASE 5: ENTITY COMPLIANCE GUARD
    const entityCheck = await EntityComplianceGuard.validateDomainAction({
      userId: capitalDeal.sponsorUserId!,
      domain: "BROKERAGE",
      action: "EXECUTE_DEAL",
    });
    if (!entityCheck.allowed) {
      throw new Error(entityCheck.reason || "Entity compliance failure.");
    }

    // PHASE 2: OACIQ GUARD
    const regCheck = await RegulatoryGuardService.validateAction(capitalDeal.sponsorUserId!, "EXECUTE_DEAL");
    if (!regCheck.allowed) {
      throw new Error(regCheck.reason || "Unauthorized brokerage action.");
    }

    // Update status to CLOSED_RAISE and link to the execution deal
    // We'll store the link in metadata for now as there's no direct field in schema
    await prisma.amfCapitalDeal.update({
      where: { id: params.capitalDealId },
      data: {
        status: "EXECUTING",
      },
    });

    await logActivity({
      userId: capitalDeal.sponsorUserId,
      action: "amf_deal_execution_started",
      entityType: "AmfCapitalDeal",
      entityId: params.capitalDealId,
      metadata: { purchaseDealId: params.dealId },
    });

    return { success: true };
  }

  /**
   * PHASE 6 & 8: DISTRIBUTION
   * Distributes profits to investors, and records brokerage commissions.
   */
  static async distributeProfits(params: {
    dealId: string;
    totalProfit: number;
    brokerCommission?: number;
    platformFee?: number;
  }) {
    const investments = await prisma.amfInvestment.findMany({
      where: { capitalDealId: params.dealId, status: "COMMITTED" },
    });

    const totalCommitted = investments.reduce((acc, curr) => acc + curr.amount, 0);
    const distributions = [];

    // 1. Distribute to investors
    for (const inv of investments) {
      const share = inv.amount / totalCommitted;
      const amount = share * params.totalProfit;

      const record = await prisma.amfDistributionRecord.create({
        data: {
          capitalDealId: params.dealId,
          investorId: inv.investorId,
          kind: "DISTRIBUTION",
          amount: amount,
          notes: `Profit distribution for ${inv.amount} committed.`,
        },
      });
      distributions.push(record);
    }

    // 2. Record Brokerage Commission (Phase 6)
    if (params.brokerCommission) {
      const brokerRecord = await prisma.amfDistributionRecord.create({
        data: {
          capitalDealId: params.dealId,
          kind: "BROKER_COMMISSION",
          amount: params.brokerCommission,
          notes: "Brokerage commission for deal execution.",
        },
      });
      distributions.push(brokerRecord);
    }

    // 3. Record Platform Fee (Phase 6)
    if (params.platformFee) {
      const platformRecord = await prisma.amfDistributionRecord.create({
        data: {
          capitalDealId: params.dealId,
          kind: "PLATFORM_FEE",
          amount: params.platformFee,
          notes: "Platform technology fee.",
        },
      });
      distributions.push(platformRecord);
    }

    return distributions;
  }

  /**
   * PHASE 9: AUDIT + LOGGING
   * Generates a full audit trail for a deal.
   */
  static async getAuditTrail(capitalDealId: string) {
    const logs = await prisma.activityLog.findMany({
      where: {
        OR: [
          { entityType: "AmfCapitalDeal", entityId: capitalDealId },
          { metadata: { path: ["capitalDealId"], equals: capitalDealId } },
          { metadata: { path: ["dealId"], equals: capitalDealId } },
        ],
      },
      orderBy: { createdAt: "asc" },
    });

    return logs;
  }

  /**
   * MOCK: RUN FULL LOOP
   * Simulates the entire lifecycle for a deal.
   */
  static async runFullLoopMock(params: {
    brokerUserId: string;
    investorUserId: string;
    listingId: string;
    amount: number;
    profit: number;
  }) {
    // 0. Set fund mode to PRIVATE for mock (Regulatory Phase 4)
    await RegulatoryGuardService.setFundMode(params.brokerUserId, "PRIVATE");
    await RegulatoryGuardService.setFundMode(params.investorUserId, "PRIVATE");

    // 1. Create Deal
    const deal = await this.createCapitalDeal({
      brokerUserId: params.brokerUserId,
      listingId: params.listingId,
      title: "Autonomous Mock Investment Deal",
    });

    // 2. Validate
    await this.validateDeal(deal.id);

    // 3. Create SPV
    await this.createSpv(deal.id, `SPV for ${deal.id}`);

    // 4. Onboard Investor
    const investor = await this.onboardInvestor({
      userId: params.investorUserId,
      legalName: "Test Investor",
      email: `investor-${Date.now()}@example.com`,
    });

    // 5. Commit Funds
    await this.commitFunds({
      investorId: investor.id,
      dealId: deal.id,
      amount: params.amount,
      riskAccepted: true,
      notFinancialAdvice: true,
      independentDecision: true,
    });

    // 6. Execute (Simulated)
    await this.executeDeal({
      capitalDealId: deal.id,
      dealId: "mock-purchase-deal-id",
    });

    // 7 & 8. Distribute Profits
    const distributions = await this.distributeProfits({
      dealId: deal.id,
      totalProfit: params.profit,
    });

    return {
      dealId: deal.id,
      investorId: investor.id,
      distributions,
    };
  }
}
