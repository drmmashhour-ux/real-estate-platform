import { describe, expect, it } from "vitest";
import { z } from "zod";
import { CopilotUserIntent } from "@/modules/copilot/domain/copilotIntents";
import { detectIntent, detectIntentKeywordOnly } from "@/modules/copilot/infrastructure/intentDetectionService";
import { mapIntentToAction } from "@/modules/copilot/application/mapIntentToAction";
import { extractMaxPriceCents, extractCityHint } from "@/modules/copilot/infrastructure/parseCopilotMessage";
import { copilotPostBodySchema } from "@/modules/copilot/api/copilotSchemas";
import { COPILOT_MASTER_DISCLAIMER } from "@/modules/copilot/domain/copilotDisclaimers";

const copilotResponseSchema = z.object({
  intent: z.string(),
  summary: z.string(),
  actions: z.array(
    z.object({
      id: z.string(),
      label: z.string(),
      href: z.string().optional(),
      kind: z.string(),
    }),
  ),
  insights: z.array(z.string()),
  warnings: z.array(z.string()),
  confidence: z.enum(["high", "medium", "low"]),
  data: z.record(z.string(), z.unknown()),
});

describe("copilot intent detection", () => {
  it("exposes Prisma CopilotIntent + numeric confidence", () => {
    const r = detectIntent("Find good deals under $600k in Laval");
    expect(r.intent).toBe("find_deals");
    expect(r.confidence).toBeGreaterThan(0);
    expect(r.confidence).toBeLessThanOrEqual(1);
  });

  it("finds deal search intent", () => {
    const r = detectIntentKeywordOnly("Find good deals under $600k in Laval");
    expect(r.intent).toBe(CopilotUserIntent.FIND_DEALS);
  });

  it("finds portfolio summary", () => {
    const r = detectIntentKeywordOnly("What changed on my watchlist this week?");
    expect(r.intent).toBe(CopilotUserIntent.PORTFOLIO_SUMMARY);
  });

  it("finds risk check", () => {
    const r = detectIntentKeywordOnly("What is the risk score for this listing?");
    expect(r.intent).toBe(CopilotUserIntent.RISK_CHECK);
  });
});

describe("copilot action mapping", () => {
  it("maps each intent to deterministic steps", () => {
    const find = mapIntentToAction(CopilotUserIntent.FIND_DEALS);
    expect(find.steps).toContain("rank_investor_portfolio");

    const px = mapIntentToAction(CopilotUserIntent.ANALYZE_PROPERTY);
    expect(px.steps).toContain("ensure_deal_analysis");

    const unk = mapIntentToAction(CopilotUserIntent.UNKNOWN);
    expect(unk.steps).toContain("clarify");
  });
});

describe("copilot parsing helpers", () => {
  it("extracts budget and city", () => {
    expect(extractMaxPriceCents("under $600k in Laval")).toBe(60_000_000);
    expect(extractCityHint("Laval")).toBe("laval");
  });
});

describe("copilot API schema", () => {
  it("accepts query-only body", () => {
    copilotPostBodySchema.parse({ query: "hello" });
  });
});

describe("deterministic authority (no LLM override)", () => {
  it("maps analyze_property to deal analysis step — TrustGraph/Deal Analyzer stay source of truth", () => {
    const px = mapIntentToAction(CopilotUserIntent.ANALYZE_PROPERTY);
    expect(px.steps).toContain("ensure_deal_analysis");
    expect(px.steps.join(" ")).not.toMatch(/invent|override/i);
  });
});

describe("safe outputs", () => {
  it("disclaimer is non-empty and avoids appraisal guarantees", () => {
    expect(COPILOT_MASTER_DISCLAIMER.length).toBeGreaterThan(40);
    expect(COPILOT_MASTER_DISCLAIMER.toLowerCase()).not.toContain("guaranteed return");
  });

  it("response shape validates", () => {
    const sample = {
      intent: "unknown",
      summary: "x",
      actions: [],
      insights: [],
      warnings: [COPILOT_MASTER_DISCLAIMER],
      confidence: "low" as const,
      data: { plan: { intent: "unknown", steps: ["clarify"] } },
    };
    expect(() => copilotResponseSchema.parse(sample)).not.toThrow();
  });
});
