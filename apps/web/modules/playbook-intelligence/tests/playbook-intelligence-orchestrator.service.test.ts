/* eslint-disable @typescript-eslint/no-explicit-any -- test mocks for playbook recommendations */
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/modules/playbook-intelligence/services/playbook-shared-context.service", () => ({
  playbookSharedContextService: {
    buildSharedContextFromDomainInput: vi.fn().mockResolvedValue({
      version: 1,
      originDomain: "DREAM_HOME",
      features: { minBedrooms: 2 },
    }),
  },
}));

import * as retrieval from "@/modules/playbook-memory/services/playbook-memory-retrieval.service";
import { playbookIntelligenceOrchestratorService } from "../services/playbook-intelligence-orchestrator.service";
import { playbookMemoryRecommendationService } from "@/modules/playbook-memory/services/playbook-memory-recommendation.service";
import { playbookCrossDomainRetrievalService } from "../services/playbook-cross-domain-retrieval.service";

const base = {
  itemType: "playbook" as const,
  playbookId: "p1",
  playbookVersionId: "v1" as any,
  key: "k",
  name: "n",
  actionType: "t",
  score: 0,
  confidence: 0.5,
  allowed: true,
  blockedReasons: [] as string[],
  rationale: [] as string[],
  executionMode: "RECOMMEND_ONLY" as const,
  baseRecommendationScore: 0.3,
};

const ctx = { context: { domain: "DREAM_HOME" as const, entityType: "x" as const, segment: { minBedrooms: 2 } } };

beforeEach(() => {
  vi.restoreAllMocks();
});

describe("playbookIntelligenceOrchestratorService", () => {
  it("native_only when the top allowed score is strong (>=0.44)", async () => {
    vi.spyOn(playbookMemoryRecommendationService, "getPlaybookRecommendations").mockResolvedValue([
      { ...base, score: 0.5, baseRecommendationScore: 0.48, allowed: true, playbookId: "a" },
    ] as any);
    vi.spyOn(playbookCrossDomainRetrievalService, "getCrossDomainCandidates").mockResolvedValue({
      requestDomain: "DREAM_HOME" as any,
      requestShared: null,
      nativeCandidates: [] as any,
      crossCandidates: [] as any,
    });
    const r = await playbookIntelligenceOrchestratorService.getIntelligentRecommendations(ctx);
    expect(r.source).toBe("native_only");
    expect(r.transferUsed).toBe(false);
  });

  it("native_plus_transfer when native is weak and cross rows exist", async () => {
    vi.spyOn(playbookMemoryRecommendationService, "getPlaybookRecommendations").mockResolvedValue([
      { ...base, score: 0.2, allowed: true, playbookId: "b" },
    ] as any);
    const transfer = { ...base, playbookId: "x1", score: 0.3, intelligenceSource: "transfer" as const, allowed: true, blockedReasons: [] as string[] };
    vi.spyOn(playbookCrossDomainRetrievalService, "getCrossDomainCandidates").mockResolvedValue({
      requestDomain: "DREAM_HOME" as any,
      requestShared: null,
      nativeCandidates: [] as any,
      crossCandidates: [
        {
          itemType: "playbook" as const,
          playbook: transfer,
          sharedFeatureFit: 0.5,
          compatibilityScore: 0.8,
          transferPenalty: 0.1,
          blockedReasons: [] as any,
          rationale: [],
        },
      ],
    });
    const r = await playbookIntelligenceOrchestratorService.getIntelligentRecommendations(ctx);
    expect(r.source).toBe("native_plus_transfer");
    expect(r.transferUsed).toBe(true);
  });

  it("memory fallback when no native and no cross", async () => {
    vi.spyOn(playbookMemoryRecommendationService, "getPlaybookRecommendations").mockResolvedValue([] as any);
    vi.spyOn(playbookCrossDomainRetrievalService, "getCrossDomainCandidates").mockResolvedValue({
      requestDomain: "DREAM_HOME" as any,
      requestShared: null,
      nativeCandidates: [] as any,
      crossCandidates: [] as any,
    });
    vi.spyOn(retrieval, "getRecommendationsWithSource").mockResolvedValue({
      recommendations: [{ itemType: "memory" as const, memoryId: "m1", actionType: "a", score: 0.4, confidence: 0.4, rationale: [], allowed: true, blockedReasons: [] }],
      source: "memory_fallback" as const,
    });
    const r = await playbookIntelligenceOrchestratorService.getIntelligentRecommendations(ctx);
    expect(r.source).toBe("memory_fallback");
  });
});
