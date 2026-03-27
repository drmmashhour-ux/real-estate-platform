import { describe, expect, it } from "vitest";
import { resolveWatchlistAlertSeverity } from "@/src/modules/watchlist-alerts/infrastructure/watchlistSeverityService";

describe("watchlist severity", () => {
  it("trust alert severity escalates correctly", () => {
    const sev = resolveWatchlistAlertSeverity({ alertType: "trust_score_changed", previousValue: 60, currentValue: 40 });
    expect(sev).toBe("warning");
  });

  it("fraud risk alert becomes critical correctly", () => {
    const sev = resolveWatchlistAlertSeverity({ alertType: "fraud_risk_up", previousValue: 60, currentValue: 80 });
    expect(sev).toBe("critical");
  });
});
