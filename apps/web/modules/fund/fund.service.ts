import { prisma } from "@/lib/db";
import { Prisma, InvestmentFundStrategy, InvestmentFundStatus, InvestmentFundMode } from "@prisma/client";

/**
 * PHASE 2: FUND CORE SERVICE
 * Manages the lifecycle of investment funds and investor relationships.
 */
export class FundService {
  /**
   * Creates a new investment fund in simulation mode.
   */
  static async createFund(input: {
    name: string;
    strategyMode?: InvestmentFundStrategy;
    initialCapital?: number;
  }) {
    const strategyMode = input.strategyMode || InvestmentFundStrategy.GROWTH;
    const initialCapital = new Prisma.Decimal(input.initialCapital || 0);

    const fund = await prisma.investmentFund.create({
      data: {
        name: input.name,
        strategyMode,
        totalCapital: initialCapital,
        availableCapital: initialCapital,
        allocatedCapital: new Prisma.Decimal(0),
        status: InvestmentFundStatus.ACTIVE,
        mode: InvestmentFundMode.SIMULATION,
      },
    });

    return fund;
  }

  /**
   * Adds an investor to a fund and recalculates ownership percentages.
   */
  static async addInvestorToFund(params: {
    fundId: string;
    userId: string;
    amount: number;
  }) {
    const { fundId, userId, amount } = params;

    // Phase 6: Compliance checks
    const { ComplianceConsentService } = await import("@/lib/compliance/compliance-consent.service");
    const { ComplianceDisclosureService } = await import("@/lib/compliance/compliance-disclosure.service");
    
    await ComplianceConsentService.requireUserConsent(userId, "FINANCIAL_SIMULATION");
    const accepted = await ComplianceDisclosureService.hasAcceptedLatest(userId, "FUND");
    if (!accepted) {
      throw new Error("DISCLOSURE_REQUIRED: User must accept latest fund risk disclosure.");
    }

    const decimalAmount = new Prisma.Decimal(amount);

    return await prisma.$transaction(async (tx) => {
      // 1. Upsert investor record
      const investor = await tx.fundInvestor.upsert({
        where: { fundId_userId: { fundId, userId } },
        update: {
          investedAmount: { increment: decimalAmount },
        },
        create: {
          fundId,
          userId,
          investedAmount: decimalAmount,
          ownershipPercent: 0, // Will be updated below
        },
      });

      // 2. Update fund total capital
      const fund = await tx.investmentFund.update({
        where: { id: fundId },
        data: {
          totalCapital: { increment: decimalAmount },
          availableCapital: { increment: decimalAmount },
        },
      });

      // 3. Recalculate all ownership percentages for this fund
      await this.recalculateOwnershipPercentages(fundId, tx);

      return investor;
    });
  }

  /**
   * Recalculates proportional ownership for all investors in a fund.
   */
  private static async recalculateOwnershipPercentages(fundId: string, tx: Prisma.TransactionClient) {
    const fund = await tx.investmentFund.findUnique({
      where: { id: fundId },
      select: { totalCapital: true },
    });

    if (!fund || fund.totalCapital.isZero()) return;

    const investors = await tx.fundInvestor.findMany({
      where: { fundId },
    });

    for (const inv of investors) {
      const percent = inv.investedAmount.div(fund.totalCapital).toNumber();
      await tx.fundInvestor.update({
        where: { id: inv.id },
        data: { ownershipPercent: percent },
      });
    }
  }

  /**
   * Loads a fund with its investors and allocations.
   */
  static async getFund(id: string) {
    return await prisma.investmentFund.findUnique({
      where: { id },
      include: {
        investors: { include: { user: { select: { name: true, email: true } } } },
        allocations: { include: { deal: true } },
        performanceSnapshots: { orderBy: { timestamp: "desc" }, take: 10 },
      },
    });
  }

  /**
   * Lists all funds accessible to a user (admin sees all, investor sees their own).
   */
  static async listFunds(userId: string, isAdmin: boolean = false) {
    if (isAdmin) {
      return await prisma.investmentFund.findMany({
        orderBy: { updatedAt: "desc" },
      });
    }

    return await prisma.investmentFund.findMany({
      where: {
        investors: { some: { userId } },
      },
      orderBy: { updatedAt: "desc" },
    });
  }
}
