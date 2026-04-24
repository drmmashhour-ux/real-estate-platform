import { buildCeoContextFingerprint } from "../ceo-memory-context.service";
import { CeoMarketSignals } from "../ceo-ai.types";

/**
 * PHASE 14: TESTS
 * Verifies core logic of the self-evolving CEO layer.
 */

describe("CEO Context Fingerprinting", () => {
  const baseSignals: CeoMarketSignals = {
    leadsLast30d: 100,
    leadsPrev30d: 80,
    seniorConversionRate30d: 0.05,
    demandIndex: 0.5,
    seoPagesIndexedApprox: 100,
    revenueTrend30dProxy: 0.02,
    operatorOnboardedLast90d: 10,
    brokersJoinedLast90d: 5,
    operatorsWithResidences: 50,
    brokerAccountsApprox: 200,
    churnInactiveBrokersApprox: 5,
    inactiveOperatorsApprox: 10,
    outreachReplyRateProxy: 0.1,
    emailEngagementScore: 0.4,
    avgLeadQualityScore: 0.7,
    activeDealsCount: 3,
    dealPipelineHealth: 0.5,
    esgActivityLevel: 0.5,
  };

  it("generates stable fingerprints for similar contexts (bucket stability)", () => {
    const similarSignals: CeoMarketSignals = {
      ...baseSignals,
      leadsLast30d: 105, // Still "UP" vs 80
      demandIndex: 0.55, // Still "STABLE"
      revenueTrend30dProxy: 0.015, // Still "FLAT" (same bucket as 0.02)
    };

    const f1 = buildCeoContextFingerprint(baseSignals);
    const f2 = buildCeoContextFingerprint(similarSignals);
    
    expect(f1).toBe(f2);
    expect(f1.length).toBe(16);
  });

  it("generates different fingerprints for significantly different contexts", () => {
    const differentSignals: CeoMarketSignals = {
      ...baseSignals,
      leadsLast30d: 50, // Now "DOWN" vs 80
      demandIndex: 0.1, // Now "WEAK"
      revenueTrend30dProxy: -0.05, // Now "NEG"
    };

    const f1 = buildCeoContextFingerprint(baseSignals);
    const f2 = buildCeoContextFingerprint(differentSignals);
    
    expect(f1).not.toBe(f2);
  });
});

