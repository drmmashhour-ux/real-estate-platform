import { prisma } from "@/lib/db";
import { logActivity } from "@/lib/audit/activity-log";

export type CompensationKind = 
  | "DISTRIBUTION"
  | "RETURN_OF_CAPITAL"
  | "INCOME_ALLOCATION"
  | "BROKER_COMMISSION" 
  | "REFERRAL_FEE" 
  | "FUND_MANAGEMENT_FEE" 
  | "PLATFORM_FEE";

/**
 * PART E: COMPENSATION / REFERRAL SAFETY
 * Prevents illegal mixing of fee types between Brokerage and Fund domains.
 */
export class CompensationSafetyService {
  /**
   * Validates if a specific compensation type is allowed for a given domain.
   */
  static validateCompensation(kind: CompensationKind, domain: "BROKERAGE" | "FUND") {
    if (domain === "BROKERAGE") {
      if (kind === "FUND_MANAGEMENT_FEE") {
        throw new Error("Fund management fees cannot be processed through brokerage workflows.");
      }
    }

    if (domain === "FUND") {
      if (kind === "BROKER_COMMISSION") {
        throw new Error("Brokerage commissions cannot be re-labeled as fund fees.");
      }
    }

    return true;
  }

  /**
   * Records a distribution record with domain enforcement.
   */
  static async recordDistribution(params: {
    capitalDealId: string;
    investorId?: string;
    kind: CompensationKind;
    amount: number;
    notes?: string;
    domain: "BROKERAGE" | "FUND";
  }) {
    // 1. Enforce separation rules
    this.validateCompensation(params.kind, params.domain);

    // 2. Persist record
    const record = await prisma.amfDistributionRecord.create({
      data: {
        capitalDealId: params.capitalDealId,
        investorId: params.investorId,
        kind: params.kind,
        amount: params.amount,
        notes: params.notes,
      },
    });

    // 3. Log (Part I)
    await logActivity({
      userId: "system", // Usually system-triggered or admin-approved
      action: `compensation_recorded_${params.kind.toLowerCase()}`,
      entityType: "AmfDistributionRecord",
      entityId: record.id,
      metadata: { 
        dealId: params.capitalDealId, 
        domain: params.domain,
        amount: params.amount 
      },
    });

    return record;
  }
}
