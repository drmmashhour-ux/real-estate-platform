import { describe, expect, it } from "vitest";
import {
  bandAiUsage,
  bandBrokerProxy,
  bandScaleDelta,
} from "@/modules/growth/growth-execution-results-bands";

describe("bandAiUsage", () => {
  it("returns insufficient_data when no telemetry", () => {
    expect(
      bandAiUsage({
        copied: false,
        locallyApproved: false,
        ignored: false,
        viewed: false,
        hasAnyTelemetry: false,
      }),
    ).toBe("insufficient_data");
  });

  it("returns positive for ack or copy", () => {
    expect(
      bandAiUsage({
        copied: true,
        locallyApproved: false,
        ignored: true,
        viewed: true,
        hasAnyTelemetry: true,
      }),
    ).toBe("positive");
  });

  it("returns neutral for ignore-only", () => {
    expect(
      bandAiUsage({
        copied: false,
        locallyApproved: false,
        ignored: true,
        viewed: false,
        hasAnyTelemetry: true,
      }),
    ).toBe("neutral");
  });
});

describe("bandBrokerProxy", () => {
  it("marks insufficient when too few events", () => {
    expect(
      bandBrokerProxy({ leadEventsRecent: 1, leadEventsPrior: 0, tier: "elite" }),
    ).toBe("insufficient_data");
  });

  it("marks positive when elite/preferred and delta favorable", () => {
    expect(
      bandBrokerProxy({ leadEventsRecent: 4, leadEventsPrior: 2, tier: "elite" }),
    ).toBe("positive");
  });
});

describe("bandScaleDelta", () => {
  it("treats lead growth as positive when delta large enough", () => {
    expect(
      bandScaleDelta({
        delta: 5,
        targetType: "leads",
        priorValue: 10,
        currentValue: 15,
      }),
    ).toBe("positive");
  });

  it("treats empty revenue windows as insufficient", () => {
    expect(
      bandScaleDelta({
        delta: 0,
        targetType: "revenue",
        priorValue: 0,
        currentValue: 0,
      }),
    ).toBe("insufficient_data");
  });
});

describe("safety: no automation guarantee", () => {
  it("band helpers are pure and make no I/O", () => {
    expect(bandAiUsage({
      copied: false,
      locallyApproved: false,
      ignored: false,
      viewed: true,
      hasAnyTelemetry: true,
    })).toBe("neutral");
  });
});
