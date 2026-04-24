import { prisma } from "@/lib/db";
import { logActivity } from "@/lib/audit/activity-log";

export type RegulatoryAction = 
  | "CREATE_LISTING"
  | "NEGOTIATE_DEAL"
  | "EXECUTE_DEAL"
  | "RAISE_FUNDS_PUBLIC"
  | "RAISE_FUNDS_PRIVATE"
  | "INVEST_PRIVATE"
  | "INVEST_SIMULATION"
  | "MANAGE_PORTFOLIO"
  | "GUARANTEE_RETURNS"
  | "MORTGAGE_BROKERAGE_EXECUTE"
  | "MORTGAGE_LENDER_REFERRAL";

/**
 * PHASE 5: ACTION VALIDATOR
 * Central logic to enforce OACIQ and AMF regulatory boundaries.
 */
export class RegulatoryGuardService {
  /**
   * Validates if a user can perform a specific regulatory action.
   * Blocks illegal actions and logs compliance events.
   */
  static async validateAction(userId: string, action: RegulatoryAction): Promise<{
    allowed: boolean;
    reason?: string;
    warning?: string;
  }> {
    const state = await this.getOrCreateRegulatoryState(userId);

    // Part of Phase 2 Integration: Force state sync with User license field
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { isOaciqLicensed: true, licenseVerifiedAt: true }
    });
    if (user?.isOaciqLicensed && !state.isLicensedBroker) {
      await prisma.lecipmRegulatoryState.update({
        where: { userId },
        data: { isLicensedBroker: true, canOperateBrokerage: true }
      });
      state.isLicensedBroker = true;
      state.canOperateBrokerage = true;
    }

    let allowed = false;
    let reason = "Unknown action";
    let warning = "";

    switch (action) {
      // PHASE 2: OACIQ GUARD
      case "CREATE_LISTING":
      case "NEGOTIATE_DEAL":
      case "EXECUTE_DEAL":
        if (state.isLicensedBroker && state.canOperateBrokerage) {
          allowed = true;
        } else {
          allowed = false;
          reason = "Brokerage action must be performed by a licensed broker with active brokerage permission.";
          warning = "Brokerage action must be performed by licensed broker";
        }
        break;

      // PHASE 3: AMF GUARD - Block Public fundraising
      case "RAISE_FUNDS_PUBLIC":
        allowed = false;
        reason = "Public fundraising is strictly prohibited without AMF registration.";
        warning = "This action requires AMF registration";
        break;

      case "GUARANTEE_RETURNS":
        allowed = false;
        reason = "Guaranteed returns are prohibited in private placements.";
        warning = "Guaranteed returns require AMF registration";
        break;

      case "MANAGE_PORTFOLIO":
        allowed = false;
        reason = "Discretionary portfolio management requires AMF registration.";
        warning = "Portfolio management requires AMF registration";
        break;

      // PHASE 3: AMF GUARD - Allow private/simulation
      case "RAISE_FUNDS_PRIVATE":
      case "INVEST_PRIVATE":
        if (state.fundMode === "PRIVATE" || state.fundMode === "REGISTERED") {
          allowed = true;
        } else {
          allowed = false;
          reason = `Investment action not allowed in ${state.fundMode} mode.`;
          warning = "Deal is in SIMULATION mode. Private investment requires mode switch.";
        }
        break;

      case "INVEST_SIMULATION":
        allowed = true; // Always allowed
        break;

      case "MORTGAGE_BROKERAGE_EXECUTE":
        // Part E.3: require proper AMF-side mortgage certification path
        const brokerProfile = await prisma.lecipmBrokerLicenceProfile.findUnique({
          where: { userId },
        });
        if (brokerProfile?.mortgageLicenceCertified) {
          allowed = true;
        } else {
          allowed = false;
          reason = "Mortgage brokerage requires specific AMF certification path.";
          warning = "AMF mortgage certification required";
        }
        break;

      case "MORTGAGE_LENDER_REFERRAL":
        // simple lender referrals allowed where compensation is not contingent on loan closing
        allowed = true;
        warning = "Compensation must not be contingent on loan closing for non-certified referrals.";
        break;

      default:
        allowed = false;
    }

    // PHASE 7: LOGGING
    void logActivity({
      userId,
      action: allowed ? "compliance_action_allowed" : "compliance_action_blocked",
      entityType: "RegulatoryAction",
      entityId: action,
      metadata: { 
        allowed, 
        reason, 
        state: {
          isLicensedBroker: state.isLicensedBroker,
          fundMode: state.fundMode,
        }
      },
    });

    return { allowed, reason, warning };
  }

  /**
   * Retrieves or initializes the regulatory state for a user.
   */
  static async getOrCreateRegulatoryState(userId: string) {
    let state = await prisma.lecipmRegulatoryState.findUnique({
      where: { userId },
    });

    if (!state) {
      // Fetch user to check if they are already a broker from profile
      const profile = await prisma.lecipmBrokerLicenceProfile.findUnique({
        where: { userId },
      });

      state = await prisma.lecipmRegulatoryState.create({
        data: {
          userId,
          isLicensedBroker: profile?.licenceStatus === "active",
          canOperateBrokerage: profile?.licenceStatus === "active",
          fundMode: "SIMULATION", // Default (PHASE 4)
          canOperateFund: false,
        },
      });
    }

    return state;
  }

  /**
   * PHASE 4: MODE CONTROL
   * Allows transitioning between fund modes. REGISTERED requires manual override.
   */
  static async setFundMode(userId: string, mode: "SIMULATION" | "PRIVATE" | "REGISTERED") {
    if (mode === "REGISTERED") {
      // In a real system, this would check if the requester is an admin
      throw new Error("REGISTERED mode requires administrative approval and AMF registration proof.");
    }

    return prisma.lecipmRegulatoryState.update({
      where: { userId },
      data: { fundMode: mode },
    });
  }
}
