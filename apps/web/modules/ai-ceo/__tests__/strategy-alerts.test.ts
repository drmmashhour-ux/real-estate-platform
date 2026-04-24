import { describe, it, expect } from "vitest";
import { detectStrategicAlerts } from "../strategy.engine";
import type { AiCeoStrategicContext } from "../ai-ceo.types";

const baseContext = (): AiCeoStrategicContext => ({
  generatedAt: new Date().toISOString(),
  coverage: { thinDataWarnings: [] },
  executive: { riskLevel: "low", snapshotAgeHours: 12 },
  revenue: { conversionProxy: 0.1 },
  lecipm: {
    seniorLeads30d: 20,
    seniorClosed30d: 2,
    brokerAccountsApprox: 100,
    operatorOnboardedLast90d: 5,
    demandIndex: 0.5,
    churnInactiveBrokersApprox: 10,
    inactiveOperatorsApprox: 5,
    gtmEvents30d: 3,
    note: "",
  },
  bnhub: {
    registeredHosts: 50,
    bookingsCreated30d: 12,
    listingViews30d: 200,
    note: "",
  },
  revenueInternal: {
    mrrLatest: 100,
    mrrPrevious: 100,
    monthOverMonth: 0,
    snapshotDates: [],
    note: "",
  },
  marketplace: { note: null, seniorResidencesApprox: 80 },
});

describe("detectStrategicAlerts", () => {
  it("flags revenue drop from internal MRR series", () => {
    const ctx = baseContext();
    ctx.revenueInternal.monthOverMonth = -0.08;
    const alerts = detectStrategicAlerts(ctx);
    expect(alerts.some((a) => a.type === "REVENUE_DROP")).toBe(true);
  });

  it("flags conversion weakness when proxy low and leads sufficient", () => {
    const ctx = baseContext();
    ctx.revenue = { conversionProxy: 0.02 };
    ctx.lecipm.seniorLeads30d = 20;
    const alerts = detectStrategicAlerts(ctx);
    expect(alerts.some((a) => a.type === "CONVERSION_WEAK")).toBe(true);
  });
});
