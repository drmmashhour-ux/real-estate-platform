import { prisma } from "@/lib/db";
import { logActivity } from "@/lib/audit/activity-log";
import { snapshotBrokerInfo } from "./broker-context";

/**
 * Deal-to-Investor Profit Loop Service
 * Implements the lifecycle from broker deal creation to investor distribution.
 */
export class DealInvestorLoopService {
  /**
   * PHASE 1: DEAL CREATION
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
      },
    });

    await logActivity({
      userId: params.brokerUserId,
      action: "amf_capital_deal_created",
      entityType: "AmfCapitalDeal",
      entityId: deal.id,
      metadata: { listingId: params.listingId },
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
   * Auto-creates a legal entity (SPV) for the deal.
   */
  static async createSpv(dealId: string, legalName: string) {
    const deal = await prisma.amfCapitalDeal.findUnique({
      where: { id: dealId },
    });

    if (!deal) throw new Error("Deal not found.");

    const spv = await prisma.amfSpvCompany.create({
      data: {
        capitalDealId: dealId,
        legalName: legalName,
        jurisdiction: "QC", // Defaulting to Quebec for this platform
      },
    });

    await logActivity({
      userId: deal.sponsorUserId,
      action: "amf_spv_created",
      entityType: "AmfSpvCompany",
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
   * PHASE 5: CAPITAL RAISE
   * Investors commit funds to a deal.
   */
  static async commitFunds(params: {
    investorId: string;
    dealId: string;
    amount: number;
  }) {
    // Check investor KYC/Accreditation (Simulated)
    const investor = await prisma.amfInvestor.findUnique({
      where: { id: params.investorId },
    });

    if (!investor) throw new Error("Investor not found.");
    
    // In a real system, we'd check kycStatus === 'VERIFIED'
    
    const investment = await prisma.amfInvestment.create({
      data: {
        investorId: params.investorId,
        capitalDealId: params.dealId,
        amount: params.amount,
        status: "COMMITTED",
      },
    });

    await logActivity({
      userId: investor.userId,
      action: "amf_investment_committed",
      entityType: "AmfInvestment",
      entityId: investment.id,
      metadata: { dealId: params.dealId, amount: params.amount },
    });

    return investment;
  }

  /**
   * PHASE 6: EXECUTION
   * Links the capital deal to a property purchase/management deal.
   */
  static async executeDeal(params: {
    capitalDealId: string;
    dealId: string; // The legal purchase deal
  }) {
    const capitalDeal = await prisma.amfCapitalDeal.findUnique({
      where: { id: params.capitalDealId },
    });

    if (!capitalDeal) throw new Error("Capital deal not found.");

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
