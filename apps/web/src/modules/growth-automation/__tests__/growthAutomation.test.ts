import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/crypto/growthTokenVault", () => ({
  encryptGrowthSecret: (s: string) => `enc:${s}`,
  decryptGrowthSecret: (s: string) => s.replace(/^enc:/, ""),
  isGrowthTokenVaultConfigured: () => true,
}));

import {
  buildPublishFingerprint,
  isDuplicatePublication,
  validateDraftForPlatform,
} from "@/src/modules/growth-automation/policies/growthAutomationPolicyService";
import { computeContentPerformanceScore } from "@/src/modules/growth-automation/analytics/computeContentPerformanceScore";
import { optimizeTopicMix } from "@/src/modules/growth-automation/analytics/optimizeTopicMix";
import { pickPillarForSlot, emptyPillarCounts } from "@/src/modules/growth-automation/application/contentRotation";
import { generateStructuredHook } from "@/src/modules/growth-automation/application/hookGenerationEngine";
import { isPillarAllowedOnPlatform } from "@/src/modules/growth-automation/domain/contentTaxonomy";

describe("growth-automation policies", () => {
  it("builds stable fingerprint", () => {
    const a = buildPublishFingerprint("LINKEDIN", "topic", "2026-03-30", "hook");
    const b = buildPublishFingerprint("LINKEDIN", "topic", "2026-03-30", "hook");
    expect(a).toBe(b);
    expect(a.length).toBe(64);
  });

  it("detects duplicate fingerprint set", () => {
    const set = new Set(["abc"]);
    expect(isDuplicatePublication(set, "abc")).toBe(true);
    expect(isDuplicatePublication(set, "def")).toBe(false);
  });

  it("validates draft for platform", () => {
    const ok = validateDraftForPlatform("LINKEDIN", {
      hook: "H",
      body: "B",
      cta: "C",
      sourceProductOrFeature: "P",
    });
    expect(ok.ok).toBe(true);
  });
});

describe("content taxonomy & rotation", () => {
  it("only assigns pillars allowed on platform", () => {
    const p = pickPillarForSlot({
      platform: "TIKTOK",
      previousPillar: null,
      countsLast7Days: emptyPillarCounts(),
    });
    expect(isPillarAllowedOnPlatform("TIKTOK", p)).toBe(true);
  });

  it("avoids consecutive same pillar when alternatives exist", () => {
    const counts = emptyPillarCounts();
    counts.mistake = 0;
    counts.demo = 0;
    const first = pickPillarForSlot({
      platform: "TIKTOK",
      previousPillar: null,
      countsLast7Days: counts,
    });
    const second = pickPillarForSlot({
      platform: "TIKTOK",
      previousPillar: first,
      countsLast7Days: counts,
    });
    expect(first === "mistake" || first === "demo").toBe(true);
    expect(second === "mistake" || second === "demo").toBe(true);
    expect(second).not.toBe(first);
  });

  it("generates structured hooks", () => {
    const h = generateStructuredHook({
      pattern: "curiosity",
      pillar: "education",
      platform: "LINKEDIN",
      topicLine: "Test topic for offers",
    });
    expect(h.length).toBeGreaterThan(10);
  });
});

describe("growth-automation analytics", () => {
  it("scores performance deterministically", () => {
    const s = computeContentPerformanceScore({ views: 1000, clicks: 10, likes: 5, comments: 2, conversions: 0 });
    expect(s).toBeGreaterThan(0);
    expect(s).toBeLessThanOrEqual(100);
  });

  it("optimizeTopicMix returns guidance", () => {
    const rows = [
      { score: 10, contentItem: { topic: "A" } },
      { score: 1, contentItem: { topic: "Z" } },
    ];
    const mix = optimizeTopicMix(rows);
    expect(mix.length).toBeGreaterThan(0);
  });
});
