import { describe, expect, it } from "vitest";
import {
  ECOSYSTEM_INTERDEPENDENCIES,
  summarizeInterdependencies,
} from "../interdependency.engine";
import { assessNetworkEffects } from "../network-effect.engine";
import { assessValueLoopHealth } from "../value-loop.engine";
import { assessAdoptionDepth } from "../dependency.engine";
import { evaluateExpansion } from "../expansion.engine";
import { ECOSYSTEM_LAYER_IDS } from "../layers";

describe("ecosystem engines", () => {
  it("summarizes interdependencies per layer", () => {
    const s = summarizeInterdependencies();
    expect(s).toHaveLength(ECOSYSTEM_LAYER_IDS.length);
    expect(ECOSYSTEM_INTERDEPENDENCIES.length).toBeGreaterThan(0);
    const core = s.find((x) => x.layer === "core");
    expect(core?.outgoing.length).toBeGreaterThan(0);
  });

  it("computes network activity index", () => {
    const m = assessNetworkEffects({
      brokers: 120,
      leads: 800,
      deals: 120,
      interactions: 5000,
      prior: { brokers: 100, leads: 700, deals: 100, interactions: 4500 },
    });
    expect(m.networkActivityIndex).toBeGreaterThan(0);
    expect(m.components).toHaveLength(4);
  });

  it("assesses value loop health", () => {
    const h = assessValueLoopHealth({
      crossLayerAdoptionRate: 0.55,
      assistiveUtilizationRate: 0.4,
      outcomeQualityIndex: 0.6,
      satisfactionIndex: 0.7,
    });
    expect(h.loopStrength).toBeGreaterThan(40);
    expect(h.stages.length).toBe(5);
  });

  it("assesses adoption depth without lock-in framing", () => {
    const d = assessAdoptionDepth({
      activeLayersUsed: 4,
      integrationEngagementRate: 0.35,
      crossModuleWorkflowRate: 0.45,
      weeklySessionsPerActiveUser: 6,
      dataPortabilityUsageRate: 0.25,
    });
    expect(d.adoptionDepthScore).toBeGreaterThan(30);
    expect(d.suggestions.some((s) => s.toLowerCase().includes("export"))).toBe(true);
  });

  it("evaluateExpansion respects missing layers", () => {
    const e = evaluateExpansion({
      networkActivityIndex: 72,
      loopStrength: 68,
      adoptionDepthScore: 60,
      supportTicketsPer1kMau: 25,
      revenueStabilityIndex: 0.82,
      liveLayers: ["core", "intelligence"],
    });
    expect(e.candidateLayers.length).toBeGreaterThan(0);
    expect(e.candidateLayers).toContain("marketplace");
  });
});
