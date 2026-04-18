import { describe, expect, it } from "vitest";
import { computeGovernanceRisk } from "./ip-security-risk.service";
import type { IpSecurityGovernanceSnapshot } from "./ip-security-governance.types";

function base(): Pick<IpSecurityGovernanceSnapshot, "legal" | "security" | "production"> {
  return {
    legal: {
      termsOfServicePresent: true,
      privacyPolicyPresent: true,
      ndaTemplatesPresent: true,
      acceptableUsePresent: true,
      law25ChecklistPresent: true,
    },
    security: {
      apiSecurityReviewed: true,
      authReviewDone: true,
      stripeSecurityReviewed: true,
      dbSecurityReviewed: true,
      aiAdminReviewDone: true,
      secretsChecklistDone: true,
      derivationNotes: [],
    },
    production: {
      productionReadyScore: 0.9,
      productionReadyNote: null,
      criticalIncidentsCount: 0,
      alertCount: 0,
      incidentsNote: "",
    },
  };
}

describe("ip-security-risk.service", () => {
  it("classifies low when drafts and security signals look ok", () => {
    expect(computeGovernanceRisk(base()).riskLevel).toBe("low");
  });

  it("elevates when core legal docs missing", () => {
    const b = base();
    b.legal.termsOfServicePresent = false;
    b.legal.privacyPolicyPresent = false;
    expect(computeGovernanceRisk(b).riskLevel).toBe("high");
  });

  it("medium when single dimension fails", () => {
    const b = base();
    b.security.stripeSecurityReviewed = false;
    expect(computeGovernanceRisk(b).riskLevel).toMatch(/medium|high/);
  });
});
