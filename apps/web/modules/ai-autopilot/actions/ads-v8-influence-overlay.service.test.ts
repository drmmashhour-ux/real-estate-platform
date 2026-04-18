import { describe, expect, it, vi } from "vitest";
import type { ProposedAction } from "../ai-autopilot.types";
import {
  applyAdsV8InfluenceOverlay,
  buildAdsV8ShadowInsightsFromProposalSets,
  shouldSkipAdsV8InfluenceOverlay,
} from "./ads-v8-influence-overlay.service";

vi.mock("@/lib/logger", () => ({
  logInfo: vi.fn(),
  logWarn: vi.fn(),
}));

function pa(partial: Partial<ProposedAction> & Pick<ProposedAction, "actionType" | "entityId">): ProposedAction {
  return {
    domain: "growth",
    entityType: "ads_automation_loop",
    title: "t",
    summary: "s",
    severity: "low",
    riskLevel: "LOW",
    recommendedPayload: {},
    reasons: { confidence: 0.5 },
    subjectUserId: null,
    audience: "admin",
    ...partial,
  };
}

describe("applyAdsV8InfluenceOverlay", () => {
  it("returns live reference and skipped when quality gate fails (weak comparison)", () => {
    const live = [pa({ actionType: "a", entityId: "1", reasons: { confidence: 0.7 } })];
    const shadow = [
      pa({ actionType: "a", entityId: "1", reasons: { confidence: 0.7 } }),
      pa({ actionType: "b", entityId: "2", reasons: { confidence: 0.5 } }),
    ];
    const insights = buildAdsV8ShadowInsightsFromProposalSets(live, shadow);
    expect(shouldSkipAdsV8InfluenceOverlay(insights.metrics, insights.diff, live.length).skip).toBe(true);
    const out = applyAdsV8InfluenceOverlay({
      liveActions: live,
      shadowInsights: insights,
      constraints: { maxAdjustedFraction: 0.28 },
    });
    expect(out.influencedActions).toBe(live);
    expect(out.metadata.skipped).toBe(true);
    expect(out.metadata.applied).toBe(false);
  });

  it("strong alignment: bounded changes only; live array not mutated", () => {
    const live = [
      pa({ actionType: "loop", entityId: "e1", reasons: { confidence: 0.62 } }),
      pa({ actionType: "scale", entityId: "e2", reasons: { confidence: 0.72 } }),
    ];
    const shadow = JSON.parse(JSON.stringify(live)) as ProposedAction[];
    const insights = buildAdsV8ShadowInsightsFromProposalSets(live, shadow);
    const before0 = (live[0].reasons as { confidence: number }).confidence;
    const out = applyAdsV8InfluenceOverlay({
      liveActions: live,
      shadowInsights: insights,
      constraints: { maxAdjustedFraction: 0.28 },
    });
    expect((live[0].reasons as { confidence: number }).confidence).toBe(before0);
    expect(out.metadata.skipped).toBe(false);
    if (out.metadata.applied) {
      expect(out.influencedActions.length).toBe(live.length);
      expect(out.metadata.adjustments.length).toBeGreaterThan(0);
    }
  });

  it("enforces max adjusted fraction on many rows", () => {
    const live: ProposedAction[] = [];
    const shadow: ProposedAction[] = [];
    for (let i = 0; i < 10; i++) {
      const id = `e${i}`;
      live.push(
        pa({
          actionType: "scale",
          entityId: id,
          reasons: { confidence: 0.65 },
        }),
      );
      shadow.push(
        pa({
          actionType: "scale",
          entityId: id,
          reasons: { confidence: 0.65 },
        }),
      );
    }
    const insights = buildAdsV8ShadowInsightsFromProposalSets(live, shadow);
    const out = applyAdsV8InfluenceOverlay({
      liveActions: live,
      shadowInsights: insights,
      constraints: { maxAdjustedFraction: 0.28 },
    });
    if (out.metadata.applied) {
      const maxAllowed = Math.ceil(10 * 0.28);
      const influencedRows = out.influencedActions.filter((a, i) => {
        const t = (a.reasons as Record<string, unknown>).v8InfluenceTag;
        return t != null || JSON.stringify(a.reasons) !== JSON.stringify(live[i].reasons);
      }).length;
      expect(influencedRows).toBeLessThanOrEqual(maxAllowed);
    }
  });
});
