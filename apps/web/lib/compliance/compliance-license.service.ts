import { prisma } from "@/lib/db";

export type LicenseActionType = 
  | "BROKERAGE"
  | "MORTGAGE"
  | "FINANCIAL_ADVICE"
  | "FUND_MANAGEMENT";

/**
 * PART 3: LICENSE ENFORCEMENT SYSTEM
 * Validates the user's OACIQ and AMF certifications based on the action type.
 */
export class ComplianceLicenseService {
  /**
   * Validates if a user is authorized for a specific regulatory action category.
   */
  static async validateUserAuthorization(userId: string, actionType: LicenseActionType) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        isOaciqLicensed: true,
        oaciqLicenseNumber: true,
        brokerageName: true,
        licenseVerifiedAt: true,
        role: true,
        lecipmBrokerLicenceProfile: {
          select: {
            mortgageLicenceCertified: true,
            licenceStatus: true,
            regulator: true,
          }
        },
        lecipmRegulatoryState: {
          select: {
            fundMode: true,
            canOperateFund: true,
          }
        }
      },
    });

    if (!user) {
      return { authorized: false, reason: "User not found." };
    }

    switch (actionType) {
      case "BROKERAGE":
        // Rules: require OACIQ license + active profile
        if (!user.isOaciqLicensed || !user.oaciqLicenseNumber) {
          return { authorized: false, reason: "User does not have a verified OACIQ license." };
        }
        if (user.lecipmBrokerLicenceProfile?.licenceStatus !== "active") {
          return { authorized: false, reason: "Broker license is not active." };
        }
        return { 
          authorized: true, 
          metadata: { 
            licenseNumber: user.oaciqLicenseNumber,
            brokerageName: user.brokerageName 
          } 
        };

      case "MORTGAGE":
        // Rules: require AMF certification for mortgage brokerage
        if (!user.lecipmBrokerLicenceProfile?.mortgageLicenceCertified) {
          return { authorized: false, reason: "User is not certified by AMF for mortgage brokerage." };
        }
        return { authorized: true };

      case "FINANCIAL_ADVICE":
        // Rules: require specific AMF registration (placeholder for now)
        const canAdvise = user.role === "ADMIN" || user.lecipmRegulatoryState?.canOperateFund;
        if (!canAdvise) {
          return { authorized: false, reason: "User is not authorized to provide financial advice (AMF registration required)." };
        }
        return { authorized: true };

      case "FUND_MANAGEMENT":
        // Rules: require AMF registration or valid exemption (PRIVATE/REGISTERED mode)
        const fundMode = user.lecipmRegulatoryState?.fundMode;
        if (fundMode === "SIMULATION") {
          return { authorized: true, warning: "Simulation mode only. No regulatory trigger." };
        }
        if (!user.lecipmRegulatoryState?.canOperateFund && fundMode !== "PRIVATE") {
          return { authorized: false, reason: "Fund management requires AMF registration or validated private exemption." };
        }
        return { authorized: true };

      default:
        return { authorized: false, reason: "Unknown action type." };
    }
  }

  /**
   * Legacy wrapper for OACIQ broker license validation.
   */
  static async validateBrokerLicense(userId: string) {
    const auth = await this.validateUserAuthorization(userId, "BROKERAGE");
    if (!auth.authorized) {
      return { valid: false, reason: auth.reason };
    }

    const { evaluateBrokerLicenceForBrokerage } = await import("./oaciq/broker-licence-service");
    const oaciqEval = await evaluateBrokerLicenceForBrokerage({
      brokerUserId: userId,
      persistCheck: false,
    });

    if (!oaciqEval.allowed) {
      return {
        valid: false,
        reason: `OACIQ Rule Engine: ${oaciqEval.reasons.join(", ") || "Licence validation failed."}`,
        metadata: {
          ...oaciqEval,
          licenseNumber: auth.metadata?.licenseNumber,
        }
      };
    }

    return {
      valid: true,
      metadata: {
        licenseNumber: auth.metadata?.licenseNumber,
        oaciqEval,
      },
    };
  }
}
