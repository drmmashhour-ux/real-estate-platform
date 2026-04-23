import { describe, expect, it } from "vitest";

import {
  deriveRollupAutonomyStatus,
  friendlyAutonomyActionLabel,
  modeForQuickSwitch,
  outcomePhrase,
  persistedModeForUiSlot,
} from "./autonomy-command-center.pure";

describe("modeForQuickSwitch", () => {
  it("maps SAFE quick mode for low-risk routing domain", () => {
    const m = modeForQuickSwitch("SAFE", "lead_routing", "ASSIST");
    expect(m).toBe("SAFE_AUTOPILOT");
  });

  it("maps FULL to approval lane for critical pricing", () => {
    const m = modeForQuickSwitch("FULL", "pricing", "ASSIST");
    expect(m).toBe("FULL_AUTOPILOT_APPROVAL");
  });
});

describe("deriveRollupAutonomyStatus", () => {
  it("returns OFF when globally paused", () => {
    expect(
      deriveRollupAutonomyStatus({
        globalPaused: true,
        effectiveModes: ["SAFE_AUTOPILOT"],
        killSwitchOffFraction: 0,
      })
    ).toBe("OFF");
  });
});

describe("persistedModeForUiSlot", () => {
  it("applies assist slot for sales domain", () => {
    const m = persistedModeForUiSlot("ASSIST", "lead_routing", "ASSIST");
    expect(m).toBe("ASSIST");
  });
});

describe("copy helpers", () => {
  it("labels follow-up like actions", () => {
    expect(friendlyAutonomyActionLabel("ai_followup_send_v2")).toBe("Follow-up sent");
  });
  it("outcomePhrases", () => {
    expect(outcomePhrase("ALLOW_AUTOMATIC")).toBe("Executed automatically");
  });
});
