import { describe, expect, it } from "vitest";
import {
  collectMissionControlActionCandidates,
  buildMissionControlActionBundle,
} from "../growth-mission-control-action.service";
import type { GrowthMissionControlSummary } from "../growth-mission-control.types";
import {
  rankMissionControlActions,
  pickMissionControlTopAndRest,
} from "../growth-mission-control-top-action.service";
import { buildMissionControlHref } from "../growth-mission-control-nav.constants";

const baseSummary = (): GrowthMissionControlSummary => ({
  status: "healthy",
  todayChecklist: [],
  topRisks: [],
  humanReviewQueue: [],
  blockedDomains: [],
  frozenDomains: [],
  notes: [],
  createdAt: new Date().toISOString(),
});

describe("growth-mission-control-action-bridge", () => {
  it("maps governance freeze to governance console", () => {
    const s = {
      ...baseSummary(),
      frozenDomains: ["ads"],
      blockedDomains: [],
    };
    const bundle = buildMissionControlActionBundle(s);
    expect(bundle.topAction?.navTarget).toBe("governance_console");
    expect(bundle.topAction?.queryParams?.reason).toBe("governance_domain_posture");
  });

  it("maps fusion weak note to fusion panel", () => {
    const s = {
      ...baseSummary(),
      notes: ["Fusion weak band observed in executive cross-check"],
    };
    const bundle = buildMissionControlActionBundle(s);
    const fusion = [...(bundle.topAction ? [bundle.topAction] : []), ...bundle.actionItems].find(
      (a) => a.navTarget === "fusion",
    );
    expect(fusion?.queryParams?.reason).toBe("fusion_weak_signal");
  });

  it("maps revenue risk text to revenue target", () => {
    const s = {
      ...baseSummary(),
      topRisks: [
        {
          title: "Revenue payout drift",
          severity: "high" as const,
          source: "executive",
          why: "Reported payout variance week over week",
        },
      ],
    };
    const bundle = buildMissionControlActionBundle(s);
    const revenue = [...(bundle.topAction ? [bundle.topAction] : []), ...bundle.actionItems].find(
      (a) => a.navTarget === "revenue",
    );
    expect(revenue).toBeDefined();
  });

  it("maps broker follow-up risk toward broker closing or admin", () => {
    const s = {
      ...baseSummary(),
      topRisks: [
        {
          title: "Broker admin roster stale",
          severity: "medium" as const,
          source: "fusion",
          why: "Follow-ups pending on broker team admin",
        },
      ],
    };
    const bundle = buildMissionControlActionBundle(s);
    const targets = new Set(
      [...(bundle.topAction ? [bundle.topAction] : []), ...bundle.actionItems].map((a) => a.navTarget),
    );
    expect(targets.has("broker_team_admin") || targets.has("broker_closing")).toBe(true);
  });

  it("maps BNHub / host risk to host_bnhub", () => {
    const s = {
      ...baseSummary(),
      topRisks: [
        {
          title: "BNHub conversion dip",
          severity: "high" as const,
          source: "executive",
          why: "Host stays funnel slowing vs prior week",
        },
      ],
    };
    const bundle = buildMissionControlActionBundle(s);
    const host = [...(bundle.topAction ? [bundle.topAction] : []), ...bundle.actionItems].find(
      (a) => a.navTarget === "host_bnhub",
    );
    expect(host).toBeDefined();
  });

  it("is deterministic for the same summary", () => {
    const s = {
      ...baseSummary(),
      missionFocus: {
        title: "Stabilize fusion inputs",
        source: "fusion" as const,
        why: "Cross-panel disagreement",
      },
      topRisks: [
        {
          title: "R1",
          severity: "high" as const,
          source: "governance",
          why: "Policy tension",
        },
      ],
    };
    const a = JSON.stringify(buildMissionControlActionBundle(s));
    const b = JSON.stringify(buildMissionControlActionBundle(s));
    expect(a).toBe(b);
  });

  it("bounds list actions to five and does not duplicate top destination", () => {
    const manyRisks = Array.from({ length: 12 }, (_, i) => ({
      title: `Risk ${i}`,
      severity: "high" as const,
      source: "fusion",
      why: `why ${i}`,
    }));
    const s = {
      ...baseSummary(),
      status: "weak" as const,
      frozenDomains: ["x"],
      missionFocus: {
        title: "Focus",
        source: "strategy" as const,
        why: "why",
      },
      topRisks: manyRisks,
      humanReviewQueue: Array.from({ length: 5 }, (_, i) => ({
        id: `rev-${i}`,
        title: `Review ${i}`,
        source: "governance_console",
        reason: "check",
        severity: "medium" as const,
      })),
      simulationRecommendation: "Run scenario A",
      strategyFocus: "Prioritize geo expansion",
      todayChecklist: ["Broker callbacks — confirm pipeline"],
      notes: ["fusion weak signal in band 2"],
    };
    const bundle = buildMissionControlActionBundle(s);
    expect(bundle.actionItems.length).toBeLessThanOrEqual(5);
    if (bundle.topAction) {
      expect(bundle.actionItems.every((x) => x.navTarget !== bundle.topAction!.navTarget)).toBe(true);
    }
  });

  it("dedupes duplicate nav targets in ranked list", () => {
    const raw = collectMissionControlActionCandidates({
      ...baseSummary(),
      frozenDomains: ["a"],
      missionFocus: { title: "T", source: "governance", why: "w" },
    });
    const ranked = rankMissionControlActions(raw);
    const seen = new Set<string>();
    for (const r of ranked) {
      expect(seen.has(r.navTarget)).toBe(false);
      seen.add(r.navTarget);
    }
  });

  it("pick top and rest separates first item", () => {
    const ranked = rankMissionControlActions([
      {
        id: "a",
        source: "focus",
        title: "t1",
        description: "d",
        navTarget: "fusion",
        actionType: "open_panel",
        priority: "high",
        rationale: "r",
        operatorHint: "o",
        doneHint: "done",
      },
      {
        id: "b",
        source: "risk",
        title: "t2",
        description: "d",
        navTarget: "executive",
        actionType: "inspect_risk",
        priority: "high",
        rationale: "r",
        operatorHint: "o",
        doneHint: "done",
      },
    ]);
    const { topAction, rest } = pickMissionControlTopAndRest(ranked, 5);
    expect(topAction?.id).toBe("a");
    expect(rest.map((x) => x.id)).toEqual(["b"]);
  });

  it("builds safe navigation hrefs with mission-control marker", () => {
    const h = buildMissionControlHref("en", "ca", "fusion", { reason: "fusion_weak_signal" });
    expect(h).toContain("from=mission-control");
    expect(h).toContain("reason=fusion_weak_signal");
    expect(h).toContain("#growth-mc-fusion");
    const admin = buildMissionControlHref("en", "ca", "broker_team_admin", { reason: "broker" });
    expect(admin).toContain("/admin/broker-team");
    expect(admin).not.toContain("#");
  });
});
