import { describe, expect, it } from "vitest";
import { compareAdsAutopilotProposalSets } from "./ads-automation-loop.autopilot.adapter.shadow";
import type { ProposedAction } from "../ai-autopilot.types";

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

describe("compareAdsAutopilotProposalSets", () => {
  it("marks aligned when sets and confidences match", () => {
    const a = pa({ actionType: "x", entityId: "e1", reasons: { confidence: 0.6 } });
    const b = pa({ actionType: "x", entityId: "e1", reasons: { confidence: 0.6 } });
    const d = compareAdsAutopilotProposalSets([a], [b]);
    expect(d.aligned).toBe(true);
    expect(d.onlyInLive).toEqual([]);
    expect(d.onlyInShadow).toEqual([]);
  });

  it("detects onlyInShadow", () => {
    const live = pa({ actionType: "a", entityId: "1", reasons: { confidence: 0.5 } });
    const shadow = [
      pa({ actionType: "a", entityId: "1", reasons: { confidence: 0.5 } }),
      pa({ actionType: "b", entityId: "2", reasons: { confidence: 0.4 } }),
    ];
    const d = compareAdsAutopilotProposalSets([live], shadow);
    expect(d.aligned).toBe(false);
    expect(d.onlyInShadow.length).toBe(1);
  });
});
