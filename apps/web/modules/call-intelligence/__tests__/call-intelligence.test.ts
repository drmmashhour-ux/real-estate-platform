import { describe, expect, it } from "vitest";

import { analyzeTranscript } from "../call-analysis.service";
import { getIntelSuggestions } from "../call-ai-suggestion.service";
import { buildIntelPerformanceVm } from "../call-intelligence-insights.service";
import { mergeTranscriptChunks } from "../call-transcription.service";
import type { ScriptConversionStats } from "@/modules/sales-scripts/sales-script.types";

describe("analyzeTranscript", () => {
  it("detects objections and sentiment hints", () => {
    const r = analyzeTranscript("We're not interested — send an email maybe next quarter.");
    expect(r.objectionsDetected.length).toBeGreaterThan(0);
    expect(["negative", "mixed", "neutral"]).toContain(r.sentiment);
    expect(r.conversionLikelihood).toBeGreaterThanOrEqual(0);
    expect(r.conversionLikelihood).toBeLessThanOrEqual(1);
  });
});

describe("getIntelSuggestions", () => {
  it("returns lines for opening stage", () => {
    const r = getIntelSuggestions({
      lastClientSentence: "",
      audience: "BROKER",
      scriptCategory: "cold_call_broker",
      stage: "opening",
      scriptContext: { audience: "BROKER" },
    });
    expect(r.suggested.length).toBeGreaterThan(20);
    expect(r.alternatives.length).toBeGreaterThan(0);
  });
});

describe("mergeTranscriptChunks", () => {
  it("joins final lines with speaker tags", () => {
    const t = mergeTranscriptChunks([
      { id: "1", atMs: 1, text: "Hi", speaker: "rep", final: true },
      { id: "2", atMs: 2, text: "Busy.", speaker: "counterpart", final: true },
    ]);
    expect(t).toContain("[rep]");
    expect(t).toContain("[counterpart]");
  });
});

describe("buildIntelPerformanceVm", () => {
  it("computes rates from stats", () => {
    const stats: ScriptConversionStats = {
      byCategory: {
        cold_call_broker: {
          total: 10,
          byOutcome: { DEMO: 3, LOST: 2, INTERESTED: 1 },
        },
      },
      topObjections: [],
    };
    const vm = buildIntelPerformanceVm(stats, 10);
    expect(vm.callsPerDayApprox).toBe(1);
    expect(vm.successRateApprox).toBeGreaterThan(0);
    expect(vm.topCategories[0]?.category).toBe("cold_call_broker");
  });
});
