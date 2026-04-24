import { describe, expect, it } from "vitest";

import { dealNextActionHint } from "../command-center-deal-hints";
import { mapCommandCenterFeedToIntelligence } from "../command-center-intelligence-feed.service";
import { partitionSignalsByZone } from "../command-center-signal.service";
import { visibleSectionsForRole } from "../command-center-visibility";
import type { Signal } from "../signal.types";
import { isExecutiveCommandCenter } from "../command-center.types";

describe("command center visibility", () => {
  it("treats only ADMIN as executive command center", () => {
    expect(isExecutiveCommandCenter("ADMIN")).toBe(true);
    expect(isExecutiveCommandCenter("BROKER")).toBe(false);
  });

  it("hides marketing for brokers", () => {
    const b = visibleSectionsForRole("BROKER");
    expect(b.marketingExpansion).toBe(false);
    expect(b.trustRisk).toBe(true);

    const a = visibleSectionsForRole("ADMIN");
    expect(a.marketingExpansion).toBe(true);
  });
});

describe("signals + intelligence feed", () => {
  it("partitions signals by severity into zones", () => {
    const signals: Signal[] = [
      {
        id: "a",
        domain: "DEAL",
        severity: "CRITICAL",
        title: "t",
        value: "1",
        delta: null,
        explanation: "e",
        recommendedActions: [],
        source: { engine: "aggregated" },
        timestamp: new Date().toISOString(),
        impact: 90,
      },
      {
        id: "b",
        domain: "LEAD",
        severity: "INFO",
        title: "t2",
        value: "2",
        delta: null,
        explanation: "e2",
        recommendedActions: [],
        source: { engine: "aggregated" },
        timestamp: new Date().toISOString(),
        impact: 10,
      },
    ];
    const z = partitionSignalsByZone(signals);
    expect(z.critical).toHaveLength(1);
    expect(z.healthy).toHaveLength(1);
    expect(z.attention).toHaveLength(0);
  });

  it("maps feed rows to intelligence items with explanation + actions", () => {
    const items = mapCommandCenterFeedToIntelligence(
      [
        {
          id: "lead:x",
          domain: "lead",
          title: "raw",
          href: "/dashboard/lecipm/leads",
          createdAt: new Date().toISOString(),
          statusLane: "healthy",
          icon: "user",
        },
      ],
      "BROKER",
    );
    expect(items[0]?.explanation.length).toBeGreaterThan(10);
    expect(items[0]?.recommendedActions.length).toBeGreaterThan(0);
    expect(items[0]?.title).toContain("Lead");
  });

  it("deal next-action hint reacts to risk flag", () => {
    expect(dealNextActionHint({ id: "1", label: "d", stage: "s", priceCents: 0, score: null, riskHint: "HIGH", updatedAt: "" })).toContain(
      "De-risk",
    );
  });
});
