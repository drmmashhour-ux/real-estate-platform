import { describe, expect, it, vi } from "vitest";

vi.mock("@/config/feature-flags", () => ({
  brokerIncentivesFlags: { brokerIncentivesV1: false },
}));

describe("broker-incentives-team-bridge.service", () => {
  it("does not load incentive payloads when incentives engine flag is off", async () => {
    const { maybeBuildBrokerIncentiveSummaryForTeamView } = await import("../broker-incentives-team-bridge.service");
    const r = await maybeBuildBrokerIncentiveSummaryForTeamView("nonexistent-broker");
    expect(r).toBeNull();
  });
});
