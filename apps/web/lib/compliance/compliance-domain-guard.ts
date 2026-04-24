import { NextResponse } from "next/server";
import { EntityComplianceGuard, SystemDomain } from "./entity-compliance-guard";
import type { LicenseActionType } from "./compliance-license.service";
import { logActivity } from "@/lib/audit/activity-log";

/**
 * PART 7: SYSTEM ENFORCEMENT (CODE)
 * Logic to consolidate domain permissions, license validation, and consent checks.
 */
export class ComplianceDomainGuard {
  /**
   * Comprehensive validation for any domain-tagged action.
   */
  static async validate(params: {
    userId: string;
    domain: SystemDomain;
    action: string;
    entityId?: string;
  }) {
    // 1. Validate Domain & Entity Separation (Part 2)
    const entityCheck = await EntityComplianceGuard.validateDomainAction(params);
    if (!entityCheck.allowed) {
      return { allowed: false, reason: entityCheck.reason };
    }

    // 2. Validate License & Authorization (Part 3)
    const licenseAction = this.mapDomainActionToLicense(params.domain, params.action);
    if (licenseAction) {
      const { ComplianceLicenseService } = await import("./compliance-license.service");
      const authCheck = await ComplianceLicenseService.validateUserAuthorization(params.userId, licenseAction);
      if (!authCheck.authorized) {
        return { allowed: false, reason: authCheck.reason };
      }
    }

    // 3. Investor Protection / Consent (Part 9)
    if (params.domain === "FINANCIAL") {
      const { DealInvestorBridgeService } = await import("./deal-investor-bridge.service");
      const investorCheck = await DealInvestorBridgeService.validateInvestorCompliance(params.userId);
      if (!investorCheck.allowed) {
        return { allowed: false, reason: investorCheck.reason };
      }

      // Phase 6: Require simulation consent for all financial actions
      const { ComplianceConsentService } = await import("./compliance-consent.service");
      const consentCheck = await ComplianceConsentService.hasConsent(params.userId, "FINANCIAL_SIMULATION");
      if (!consentCheck) {
        return { allowed: false, reason: "Financial simulation consent required." };
      }
    }

    // Require data usage consent for any non-platform action
    if (params.domain !== "PLATFORM") {
      const { ComplianceConsentService } = await import("./compliance-consent.service");
      const dataConsent = await ComplianceConsentService.hasConsent(params.userId, "DATA_USAGE");
      // For now, don't hard block to avoid breaking existing flows, but log it
      if (!dataConsent) {
        console.warn(`[compliance] User ${params.userId} performing ${params.domain}/${params.action} without DATA_USAGE consent.`);
      }

      if (this.isAiAction(params.action)) {
        const aiConsent = await ComplianceConsentService.hasConsent(params.userId, "AI_DECISIONING");
        if (!aiConsent) {
          return { allowed: false, reason: "Consent for AI-driven decisioning is required for this action." };
        }
      }
    }

    return { allowed: true, entityId: entityCheck.entityId };
  }

  /**
   * Helper to map specific domain actions to required license types.
   */
  private static mapDomainActionToLicense(domain: SystemDomain, action: string): LicenseActionType | null {
    if (domain === "BROKERAGE") return "BROKERAGE";
    
    if (domain === "FINANCIAL") {
      if (action === "MORTGAGE_BROKERAGE_EXECUTE") return "MORTGAGE";
      if (action === "FINANCIAL_ADVICE") return "FINANCIAL_ADVICE";
      if (action === "FUND_MANAGEMENT" || action === "DISTRIBUTE_PROFITS") return "FUND_MANAGEMENT";
    }

    return null;
  }

  /**
   * Checks if an action is AI-driven and requires specific consent.
   */
  private static isAiAction(action: string): boolean {
    const aiKeywords = ["EVALUATE", "GENERATE", "RECOMMEND", "PROPOSE", "DECISION", "ALLOCATE", "SUMMARIZE", "DRAFT"];
    return aiKeywords.some(kw => action.toUpperCase().includes(kw));
  }
}

/**
 * High-level HOC style wrapper for API routes to enforce domain compliance.
 */
export async function withRegulatoryCompliance<T>(params: {
  domain: SystemDomain;
  action: string;
  entityId?: string;
  handler: (userId: string, entityId?: string) => Promise<NextResponse<T> | Response>;
}) {
  const { getGuestId } = await import("@/lib/auth/session");
  const userId = await getGuestId();

  if (!userId) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  const guard = await ComplianceDomainGuard.validate({
    userId,
    domain: params.domain,
    action: params.action,
    entityId: params.entityId,
  });

  if (!guard.allowed) {
    await logActivity({
      userId,
      action: "regulatory_access_denied",
      entityType: "RegulatoryAction",
      entityId: params.action,
      metadata: { domain: params.domain, reason: guard.reason },
    });
    return NextResponse.json({ 
      error: "REGULATORY_BLOCK", 
      message: guard.reason,
      domain: params.domain 
    }, { status: 403 });
  }

  return params.handler(userId, guard.entityId || undefined);
}
