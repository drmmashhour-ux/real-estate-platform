import { describe, expect, it } from "vitest";

import { validateBoundedAdjustmentText } from "../ai-ceo-system-adjustment-policy.service";

describe("validateBoundedAdjustmentText", () => {
  it("blocks punitive phrasing", () => {
    const r = validateBoundedAdjustmentText("We should hide listings punitively");
    expect(r.ok).toBe(false);
  });

  it("allows neutral ops language", () => {
    const r = validateBoundedAdjustmentText("Increase confirmation reminders and coaching templates.");
    expect(r.ok).toBe(true);
  });
});
