import { describe, expect, it, vi } from "vitest";
import { buildAuditReasonTrail, buildListingAuditPanel } from "../audit-panel.service";

vi.mock("@/lib/db", () => ({
  prisma: {
    legalIntelligenceRecord: { findMany: vi.fn().mockResolvedValue([]) },
  },
}));

vi.mock("@/modules/events/event-timeline.service", () => ({
  buildEntityTimeline: vi.fn().mockResolvedValue({ events: [], byType: {}, orderedIds: [] }),
}));

vi.mock("@/modules/legal/legal-intelligence.service", () => ({
  summarizeLegalIntelligence: vi.fn().mockResolvedValue({
    builtAt: "2026-01-01T00:00:00.000Z",
    entityType: "fsbo_listing",
    entityId: "L1",
    countsBySeverity: { info: 0, warning: 0, critical: 0 },
    countsBySignalType: {},
    totalSignals: 0,
    topAnomalyKinds: [],
    topFraudIndicatorLabels: [],
    freshnessNote: "test",
  }),
}));

vi.mock("@/config/feature-flags", () => ({
  engineFlags: { autonomousMarketplaceV1: false },
}));

describe("buildListingAuditPanel", () => {
  it("returns listing scope metadata", async () => {
    const p = await buildListingAuditPanel("L1");
    expect(p.scopeType).toBe("listing");
    expect(p.listingId).toBe("L1");
  });
});

describe("buildAuditReasonTrail", () => {
  it("sorts deterministically by sortKey", () => {
    const trail = buildAuditReasonTrail({
      listingPanel: {
        scopeType: "listing",
        listingId: "L1",
        generatedAt: "2026-01-01T00:00:00.000Z",
        statusSummary: "ok",
        timeline: [],
        legalSummary: null,
        riskAnomalySummary: "r",
        reasonTrail: [
          { source: "timeline", label: "b", detail: "d", sortKey: "2-b" },
          { source: "timeline", label: "a", detail: "d", sortKey: "2-a" },
        ],
        previewReasoningSummary: null,
        notes: [],
      },
    });
    expect(trail[0]?.label).toBe("a");
  });
});
