import { describe, expect, it } from "vitest";
import { evaluateMarketplaceExecutionGate } from "../darlink-safe-execution-gate.service";

describe("evaluateMarketplaceExecutionGate", () => {
  it("forces dry_run_only when dryRun=true", () => {
    const g = evaluateMarketplaceExecutionGate({
      policy: {
        sensitiveFinancialBlocked: false,
        listingMutationBlocked: false,
        opportunityOutcomes: {},
        notes: [],
      },
      governanceMode: "FULL_AUTOPILOT_APPROVAL",
      dryRun: true,
      proposal: {
        id: "p1",
        actionType: "ADD_INTERNAL_NOTE",
        entityType: "listing",
        entityId: "x",
        opportunityId: "o1",
        riskLevel: "low",
        reasons: [],
        payload: {},
      },
      approvalGranted: false,
    });
    expect(g.executableStatus).toBe("dry_run_only");
  });
});
