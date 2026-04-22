import { describe, expect, it } from "vitest";

import { syncRelationshipFromPipeline } from "../acquisition.constants";
import { nextPipelineStage } from "../acquisition-pipeline";
import { completionPercentFromMilestones } from "../onboarding.service";

describe("acquisition pipeline", () => {
  it("advances stages in order", () => {
    expect(nextPipelineStage("NEW")).toBe("CONTACTED");
    expect(nextPipelineStage("DEMO_SCHEDULED")).toBe("CONVERTED");
    expect(nextPipelineStage("CONVERTED")).toBeNull();
    expect(nextPipelineStage("LOST")).toBeNull();
  });

  it("maps pipeline to relationship status", () => {
    expect(syncRelationshipFromPipeline("CONVERTED")).toBe("ONBOARDED");
    expect(syncRelationshipFromPipeline("LOST")).toBe("LOST");
  });
});

describe("onboarding completion", () => {
  it("computes percent from four milestones", () => {
    const base = {
      accountCreatedAt: null as Date | null,
      firstListingAt: null as Date | null,
      firstBookingOrLeadAt: null as Date | null,
      subscriptionActivatedAt: null as Date | null,
    };
    expect(completionPercentFromMilestones(base)).toBe(0);
    expect(
      completionPercentFromMilestones({
        ...base,
        accountCreatedAt: new Date(),
      }),
    ).toBe(25);
    expect(
      completionPercentFromMilestones({
        accountCreatedAt: new Date(),
        firstListingAt: new Date(),
        firstBookingOrLeadAt: new Date(),
        subscriptionActivatedAt: new Date(),
      }),
    ).toBe(100);
  });
});
