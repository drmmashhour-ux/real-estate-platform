import { describe, expect, it } from "vitest";
import { applyControlledAction, isControlledSafeActionType } from "../execution/action-application.service";
import type { ProposedAction } from "../types/domain.types";

const proposed = (type: ProposedAction["type"]): ProposedAction => ({
  id: "pa",
  type,
  target: { type: "fsbo_listing", id: "l1" },
  confidence: 0.9,
  risk: "LOW",
  title: "",
  explanation: "",
  humanReadableSummary: "",
  metadata: {},
  suggestedAt: new Date().toISOString(),
  sourceDetectorId: "d",
  opportunityId: "o",
});

describe("applyControlledAction", () => {
  it("does not throw for unsupported types", async () => {
    const r = await applyControlledAction({
      proposed: proposed("START_PROMOTION"),
      gate: {
        allowed: true,
        status: "not_started",
        reasons: ["execution_success"],
        requiresApproval: false,
      },
    });
    expect(r.ok).toBe(true);
    expect(r.executionResult?.status).toBe("DRY_RUN");
  });

  it("allows only CREATE_TASK and FLAG_REVIEW for controlled live path", () => {
    expect(isControlledSafeActionType("CREATE_TASK")).toBe(true);
    expect(isControlledSafeActionType("FLAG_REVIEW")).toBe(true);
    expect(isControlledSafeActionType("REQUEST_HUMAN_APPROVAL")).toBe(false);
    expect(isControlledSafeActionType("START_PROMOTION")).toBe(false);
    expect(isControlledSafeActionType("SEND_LEAD_FOLLOWUP")).toBe(false);
    expect(isControlledSafeActionType("APPLY_PRICE_CHANGE")).toBe(false);
  });
});
