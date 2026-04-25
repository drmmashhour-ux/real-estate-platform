import { describe, expect, it } from "vitest";
import { recommendOfferActions } from "../offer-recommendation.engine";
import type { OfferBlocker, OfferReadinessResult, OfferStrategyContext } from "../offer-strategy.types";
import type { OfferPosture, CompetitiveOfferRisk } from "../offer-strategy.types";

describe("recommendOfferActions", () => {
  it("avoids loud offer nudge when hold posture", () => {
    const posture: OfferPosture = { style: "hold_and_nurture", rationale: [], warnings: [] };
    const rec = recommendOfferActions(
      { financingReadiness: "weak" } as OfferStrategyContext,
      { label: "not_ready", score: 30, rationale: [] } as OfferReadinessResult,
      posture,
      [{ key: "financing_uncertainty", label: "F", severity: "high", rationale: [] } as OfferBlocker],
      { level: "medium", rationale: [] } as CompetitiveOfferRisk
    );
    const urgent = rec.find((r) => r.key === "propose_offer_discussion");
    expect(urgent == null || urgent.priority !== "high").toBe(true);
  });

  it("includes financing clarify when weak", () => {
    const rec = recommendOfferActions(
      { financingReadiness: "weak" } as OfferStrategyContext,
      { label: "discussion_ready", score: 50, rationale: [] } as OfferReadinessResult,
      { style: "soft_explore", rationale: [], warnings: [] } as OfferPosture,
      [{ key: "financing_uncertainty", label: "F", severity: "high", rationale: [] } as OfferBlocker],
      { level: "low", rationale: [] } as CompetitiveOfferRisk
    );
    expect(rec.map((r) => r.key)).toContain("clarify_financing_before_offer");
  });
});
