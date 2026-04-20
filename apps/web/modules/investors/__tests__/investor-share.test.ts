import { beforeEach, describe, expect, it, vi } from "vitest";
import { buildInvestorDashboard } from "@/modules/investors/investor-dashboard.service";
import type { InvestorDashboard } from "@/modules/investors/investor-dashboard.types";
import { filterInvestorDashboardForShare, scrubInvestorShareText } from "@/modules/investors/investor-share-filter.service";
import {
  clearInvestorShareStoreForTests,
  createInvestorShareLink,
  getInvestorShareLinkByToken,
  loadPublicInvestorShareDashboard,
  revokeInvestorShareLink,
} from "@/modules/investors/investor-share.service";

vi.mock("@/modules/investors/investor-dashboard.service", () => ({
  buildInvestorDashboard: vi.fn(),
}));

const mockDashboard: InvestorDashboard = {
  generatedAt: "2026-04-01T00:00:00.000Z",
  metrics: [
    {
      label: "Fast Deal bundle score",
      value: "72",
      change: "vs prior 14d",
      period: "last 14d",
      confidence: "medium",
    },
  ],
  sections: [
    { title: "Key metrics", type: "metrics", content: "• x" },
    { title: "Growth narrative", type: "narrative", content: "Headline\n\nSummary" },
    { title: "Execution proof", type: "insights", content: "Growth Machine internal line" },
    { title: "Expansion strategy", type: "insights", content: "OK expansion line" },
    { title: "Risks & warnings", type: "risks", content: "Market risk" },
    { title: "Outlook", type: "narrative", content: "Outlook line" },
  ],
  narrative: {
    headline: "Headline",
    summary: "Summary body",
    growthStory: ["Growth line"],
    executionProof: ["Growth Machine telemetry"],
    expansionStory: ["Expansion OK"],
    risks: ["Standard disclosure"],
    outlook: ["Forward framing"],
  },
  meta: {
    warnings: ["FEATURE_X internal warning"],
    missingDataAreas: ["city comparison sparse"],
    sparseBundle: false,
  },
};

describe("investor share service", () => {
  beforeEach(() => {
    clearInvestorShareStoreForTests();
    vi.mocked(buildInvestorDashboard).mockResolvedValue(mockDashboard);
  });

  it("creates a link with a long unguessable token", async () => {
    const link = await createInvestorShareLink({
      publicTitle: "Q1",
      visibility: {
        metrics: true,
        narrative: false,
        executionProof: false,
        expansionStory: false,
        risks: false,
        outlook: false,
      },
    });
    expect(link.token.length).toBeGreaterThan(40);
    expect(link.status).toBe("active");
    expect(link.viewCount).toBe(0);
  });

  it("looks up an active link by token", async () => {
    const created = await createInvestorShareLink({
      publicTitle: "T",
      visibility: {
        metrics: true,
        narrative: true,
        executionProof: true,
        expansionStory: true,
        risks: true,
        outlook: true,
      },
    });
    const found = getInvestorShareLinkByToken(created.token);
    expect(found?.id).toBe(created.id);
  });

  it("blocks revoked links", async () => {
    const created = await createInvestorShareLink({
      publicTitle: "T",
      visibility: {
        metrics: true,
        narrative: false,
        executionProof: false,
        expansionStory: false,
        risks: false,
        outlook: false,
      },
    });
    expect(revokeInvestorShareLink(created.id)).toBe(true);
    expect(getInvestorShareLinkByToken(created.token)).toBeNull();
  });

  it("blocks expired links", async () => {
    const past = new Date(Date.now() - 60_000).toISOString();
    const created = await createInvestorShareLink({
      publicTitle: "T",
      expiresAt: past,
      visibility: {
        metrics: true,
        narrative: false,
        executionProof: false,
        expansionStory: false,
        risks: false,
        outlook: false,
      },
    });
    expect(getInvestorShareLinkByToken(created.token)).toBeNull();
  });

  it("increments viewCount on public load", async () => {
    const created = await createInvestorShareLink({
      publicTitle: "T",
      visibility: {
        metrics: true,
        narrative: true,
        executionProof: false,
        expansionStory: false,
        risks: true,
        outlook: false,
      },
    });
    const first = await loadPublicInvestorShareDashboard(created.token);
    expect(first?.dashboard.publicTitle).toBeTruthy();
    expect(JSON.stringify(first?.dashboard)).not.toMatch(
      /\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/i,
    );
    expect(getInvestorShareLinkByToken(created.token)?.viewCount).toBe(1);
    await loadPublicInvestorShareDashboard(created.token);
    expect(getInvestorShareLinkByToken(created.token)?.viewCount).toBe(2);
  });

  it("respects visibility toggles in filtered output", async () => {
    const created = await createInvestorShareLink({
      publicTitle: "T",
      visibility: {
        metrics: true,
        narrative: false,
        executionProof: false,
        expansionStory: false,
        risks: false,
        outlook: false,
      },
    });
    const out = await loadPublicInvestorShareDashboard(created.token);
    expect(out?.dashboard.metrics.length).toBeGreaterThan(0);
    expect(out?.dashboard.narrative.headline).toBe("");
    expect(out?.dashboard.warnings.length).toBeGreaterThan(0);
  });

  it("does not expose internal Growth Machine phrasing in shared narrative slices", async () => {
    const created = await createInvestorShareLink({
      publicTitle: "T",
      visibility: {
        metrics: false,
        narrative: true,
        executionProof: true,
        expansionStory: true,
        risks: true,
        outlook: true,
      },
    });
    const out = await loadPublicInvestorShareDashboard(created.token);
    const blob = JSON.stringify(out?.dashboard);
    expect(blob).not.toMatch(/Growth Machine/i);
    expect(blob).not.toMatch(/FEATURE_/);
  });
});

describe("scrubInvestorShareText", () => {
  it("removes UUID-like segments from outward copy", () => {
    const s = scrubInvestorShareText("Score 11111111-1111-4111-8111-111111111111 is up");
    expect(s).not.toMatch(/[0-9a-f]{8}-/i);
  });

  it("strips email-shaped strings", () => {
    const s = scrubInvestorShareText("Contact ops@example.com for details");
    expect(s).not.toMatch(/@/);
    expect(s).toMatch(/Contact/);
  });
});

describe("filterInvestorDashboardForShare", () => {
  it("strips internal warnings but keeps mapped missing-data honesty", () => {
    const filtered = filterInvestorDashboardForShare(mockDashboard, {
      metrics: true,
      narrative: true,
      executionProof: true,
      expansionStory: true,
      risks: true,
      outlook: true,
    });
    const blob = JSON.stringify(filtered);
    expect(blob).not.toMatch(/FEATURE_/);
    expect(filtered.warnings.some((w) => /geographic|limited|sparse/i.test(w) || w.length > 20)).toBe(true);
  });
});
