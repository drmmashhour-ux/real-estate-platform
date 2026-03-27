import { describe, expect, it } from "vitest";
import { isLeadDueForFollowUp } from "../domain/followUpEligibility";

describe("isLeadDueForFollowUp", () => {
  const cutoff = new Date("2025-01-02T12:00:00.000Z");

  it("is false when last contact is after cutoff (still inside fresh window)", () => {
    expect(
      isLeadDueForFollowUp({
        lastContactedAt: new Date("2025-01-02T14:00:00.000Z"),
        outreachCoachingStage: "contacted",
        pipelineStatus: "new",
        cutoff,
      })
    ).toBe(false);
  });

  it("is true when stale contacted", () => {
    expect(
      isLeadDueForFollowUp({
        lastContactedAt: new Date("2025-01-01T00:00:00.000Z"),
        outreachCoachingStage: "contacted",
        pipelineStatus: "new",
        cutoff,
      })
    ).toBe(true);
  });

  it("excludes replied and demo_booked", () => {
    expect(
      isLeadDueForFollowUp({
        lastContactedAt: new Date("2025-01-01T00:00:00.000Z"),
        outreachCoachingStage: "replied",
        pipelineStatus: "new",
        cutoff,
      })
    ).toBe(false);
  });
});
