import { describe, expect, it, vi, beforeEach } from "vitest";
import { buildCorporateStrategySnapshot } from "../corporate-strategy.service";

const hi = { disclaimer: "H", dataSources: [""] as string[], roles: [
  { kind: "operations" as const, priority: "low" as const, headcountHint: { min: 0, max: 0, basis: "x" }, rationale: [""], dataTrace: "t" },
] };
const bud = { disclaimer: "B", dataSources: [""] as string[], lines: [
  { label: "L", scope: "market" as const, scopeKey: "Q", action: "maintain" as const, priority: "low" as const, rationale: [""], dataTrace: "" },
] };
const pr = { disclaimer: "P", dataSources: [""] as string[], prioritize: [{ key: "k", title: "Funnel", priority: "low" as const, rationale: [""], dataTrace: "" }], deprioritize: [] as { key: string; title: string; priority: "low" | "medium" | "high"; rationale: string[]; dataTrace: string; }[] };
const bl = [{ id: "1", kind: "other" as const, severity: "info" as const, title: "ok", rationale: "r", dataTrace: "t", suggestedResponse: "s" }];
const rk = [{ type: "x", severity: "low" as const, message: "m", rationale: "r", mitigation: "m" }];

vi.mock("@/config/feature-flags", () => ({ engineFlags: { corporateStrategyV1: false } }));
vi.mock("../hiring-strategy.engine", () => ({ generateHiringStrategy: () => Promise.resolve(hi) }));
vi.mock("../budget-strategy.engine", () => ({ generateBudgetStrategy: () => Promise.resolve(bud) }));
vi.mock("../product-roadmap.engine", () => ({ generateProductRoadmapStrategy: () => Promise.resolve(pr) }));
vi.mock("../bottleneck.engine", () => ({ detectOrganizationalBottlenecks: () => Promise.resolve(bl) }));
vi.mock("../risk.engine", () => ({ analyzeStrategicRisks: () => Promise.resolve(rk) }));

describe("buildCorporateStrategySnapshot", () => {
  it("assembles a view and never throws", async () => {
    const v = await buildCorporateStrategySnapshot("p", { writeDb: false });
    expect(v.periodKey).toBe("p");
    expect(v.quarterly.topPriorities.length).toBeGreaterThan(0);
    expect(v.budget.lines.length).toBe(1);
    expect(v.hiring.disclaimer).toBe("H");
  });
});

describe("safety of narrative", () => {
  it("advisory is stated in service disclaimer", async () => {
    const v = await buildCorporateStrategySnapshot("x", { writeDb: false });
    expect(v.disclaimer.toLowerCase()).toMatch(/advisory/);
  });
});
