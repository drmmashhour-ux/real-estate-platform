import { describe, expect, it } from "vitest";

import { evaluateLegalRisk } from "../legal/legal-risk.service";

describe("legal risk", () => {
  it("elevates fraud signal to high and requires approval", () => {
    const result = evaluateLegalRisk({
      actionType: "UPDATE_LISTING",
      signals: ["fraud_flag"],
    });

    expect(result.level).toBe("HIGH");
    expect(result.requiresApproval).toBe(true);
    expect(result.requiresBlock).toBe(false);
  });

  it("detects payout anomaly as high", () => {
    const result = evaluateLegalRisk({
      actionType: "PAYOUT",
      signals: ["payout_anomaly"],
    });

    expect(result.level).toBe("HIGH");
    expect(result.requiresApproval).toBe(true);
  });
});
