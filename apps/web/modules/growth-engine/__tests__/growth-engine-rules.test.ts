import { describe, expect, it } from "vitest";

import { mapSignalsToActions } from "../growth-action.service";
import { shouldAutoExecuteSafeActions, requiresApprovalForAllActions } from "../growth-autonomy.service";

describe("growth-engine rules", () => {
  it("maps high_views_low_booking to promote + approval-gated price", () => {
    const actions = mapSignalsToActions([
      {
        id: "x",
        signal: "high_views_low_booking",
        entityKind: "fsbo_listing",
        entityId: "l1",
        severity: "high",
        context: {},
        detectedAt: new Date().toISOString(),
      },
    ]);
    const codes = actions.map((a) => a.action);
    expect(codes).toContain("promote_listing");
    expect(codes).toContain("adjust_price");
    expect(actions.find((a) => a.action === "adjust_price")?.riskTier).toBe("requires_approval");
    expect(actions.find((a) => a.action === "promote_listing")?.riskTier).toBe("safe_auto");
  });

  it("SAFE_AUTOPILOT allows safe auto; FULL approval mode flags all via approval service at runtime", () => {
    expect(shouldAutoExecuteSafeActions("SAFE_AUTOPILOT")).toBe(true);
    expect(requiresApprovalForAllActions("FULL_AUTOPILOT_APPROVAL")).toBe(true);
  });
});
