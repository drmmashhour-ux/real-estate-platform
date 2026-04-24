import { prisma } from "@/lib/db";
import { logActivity } from "@/lib/audit/activity-log";
import { EntityComplianceGuard } from "./entity-compliance-guard";
import { BrokerActionGuard } from "./broker-action-guard";

/**
 * PART D: DEAL -> INVESTOR LOOP (LEGAL BRIDGE)
 * Orchestrates the structured handoff from Brokerage (OACIQ) to Fund (AMF).
 */
export class DealInvestorBridgeService {
  /**
   * Creates a structured "deal handoff package" from the brokerage side.
   * This is a BROKERAGE domain action.
   */
  static async createHandoffPackage(params: {
    brokerUserId: string;
    dealId: string;
    summary: string;
    underwritingRecommendation?: string;
    risks: string;
    financialProjection?: string;
    esgRetrofitSnapshot?: string;
    financingSnapshot?: string;
    committeeStatus?: string;
    complianceBlockers?: string;
    esgScore?: number;
  }) {
    // 1. Domain Auth
    const guard = await EntityComplianceGuard.validateDomainAction({
      userId: params.brokerUserId,
      domain: "BROKERAGE",
      action: "CREATE_HANDOFF_PACKAGE",
    });
    if (!guard.allowed) {
      throw new Error(guard.reason || "Unauthorized brokerage domain action.");
    }

    // 2. Brokerage Action Guard (Regulatory + Ownership)
    const brokerGuard = await BrokerActionGuard.validateBrokerageAction({
      userId: params.brokerUserId,
      action: "EXECUTE_DEAL", // Using EXECUTE_DEAL as a proxy for high-level management
      entityId: params.dealId,
      entityType: "AmfCapitalDeal",
    });
    if (!brokerGuard.allowed) {
      throw new Error(brokerGuard.reason || "Unauthorized brokerage action.");
    }

    // 3. Create Packet
    const packet = await prisma.dealInvestmentPacket.upsert({
      where: { capitalDealId: params.dealId },
      update: {
        summary: params.summary,
        underwritingRecommendation: params.underwritingRecommendation,
        risks: params.risks,
        financialProjection: params.financialProjection,
        esgRetrofitSnapshot: params.esgRetrofitSnapshot,
        financingSnapshot: params.financingSnapshot,
        committeeStatus: params.committeeStatus,
        complianceBlockers: params.complianceBlockers,
        esgScore: params.esgScore,
        entityId: guard.entityId, // The brokerage entity that originated the deal
      },
      create: {
        capitalDealId: params.dealId,
        summary: params.summary,
        underwritingRecommendation: params.underwritingRecommendation,
        risks: params.risks,
        financialProjection: params.financialProjection,
        esgRetrofitSnapshot: params.esgRetrofitSnapshot,
        financingSnapshot: params.financingSnapshot,
        committeeStatus: params.committeeStatus,
        complianceBlockers: params.complianceBlockers,
        esgScore: params.esgScore,
        entityId: guard.entityId,
        createdByBrokerId: params.brokerUserId,
      },
    });

    // 4. Audit Log (Part I)
    await logActivity({
      userId: params.brokerUserId,
      action: "handoff_packet_created",
      entityType: "DealInvestmentPacket",
      entityId: packet.id,
      metadata: { dealId: params.dealId, entityId: guard.entityId },
    });

    return packet;
  }

  /**
   * Retrieves a deal packet for the Fund domain.
   * This is a FUND domain action.
   */
  static async getDealPacketForFund(userId: string, packetId: string) {
    // 1. Domain Auth
    const guard = await EntityComplianceGuard.validateDomainAction({
      userId,
      domain: "FINANCIAL",
      action: "VIEW_DEAL_PACKET",
    });
    if (!guard.allowed) {
      throw new Error(guard.reason || "Unauthorized fund domain action.");
    }

    // 2. Part F.1: Consent / Suitability
    const compliance = await this.validateInvestorCompliance(userId);
    if (!compliance.allowed) {
      throw new Error(compliance.reason);
    }

    const packet = await prisma.dealInvestmentPacket.findUnique({
      where: { id: packetId },
      include: { 
        capitalDeal: {
          include: { 
            investments: true 
          }
        }
      }
    });

    if (!packet) throw new Error("Deal packet not found.");

    // 2. Audit Log (Part I)
    await logActivity({
      userId,
      action: "deal_packet_received",
      entityType: "DealInvestmentPacket",
      entityId: packet.id,
      metadata: { fundEntityId: guard.entityId },
    });

    return packet;
  }

  /**
   * Validates if an investor has completed all compliance requirements.
   * Part F.1
   */
  static async validateInvestorCompliance(userId: string) {
    const investor = await prisma.amfInvestor.findUnique({
      where: { userId },
    });

    if (!investor) {
      await logActivity({
        userId,
        action: "investor_access_blocked_missing_onboarding",
        entityType: "AmfInvestor",
        entityId: userId,
      });
      return { allowed: false, reason: "Investor profile not found. Please complete onboarding." };
    }

    if (!investor.simulationConsent || !investor.suitabilityIntakeJson) {
      // Part I: investor_access_blocked_missing_disclosure
      await logActivity({
        userId,
        action: "investor_access_blocked_missing_disclosure",
        entityType: "AmfInvestor",
        entityId: investor.id,
        metadata: { 
          hasConsent: investor.simulationConsent, 
          hasSuitability: !!investor.suitabilityIntakeJson 
        },
      });
      return { 
        allowed: false, 
        reason: "Financial simulation consent and suitability intake required before access." 
      };
    }

    return { allowed: true, investor };
  }
}
