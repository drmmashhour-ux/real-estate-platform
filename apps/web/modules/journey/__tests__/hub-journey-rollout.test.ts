import { afterEach, describe, expect, it, vi } from "vitest";

describe("hub-journey-rollout", () => {
  const prev = process.env.FEATURE_HUB_JOURNEY_HUBS;

  afterEach(() => {
    vi.resetModules();
    if (prev === undefined) delete process.env.FEATURE_HUB_JOURNEY_HUBS;
    else process.env.FEATURE_HUB_JOURNEY_HUBS = prev;
  });

  it("allows all hubs when FEATURE_HUB_JOURNEY_HUBS is unset", async () => {
    delete process.env.FEATURE_HUB_JOURNEY_HUBS;
    vi.resetModules();
    const { isHubJourneyRolloutEnabled } = await import("../hub-journey-rollout");
    expect(isHubJourneyRolloutEnabled("seller")).toBe(true);
    expect(isHubJourneyRolloutEnabled("admin")).toBe(true);
  });

  it("restricts to allowlisted hubs when set", async () => {
    process.env.FEATURE_HUB_JOURNEY_HUBS = "buyer,rent";
    vi.resetModules();
    const { isHubJourneyRolloutEnabled } = await import("../hub-journey-rollout");
    expect(isHubJourneyRolloutEnabled("buyer")).toBe(true);
    expect(isHubJourneyRolloutEnabled("seller")).toBe(false);
  });
});
