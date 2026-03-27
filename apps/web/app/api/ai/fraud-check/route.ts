import { NextRequest } from "next/server";
import { fraudCheckListing, fraudCheckEntity } from "@/lib/ai";
import {
  computeFraudScore,
  computeFraudScoreFromSignals,
  evaluateAndStoreFraudScore,
} from "@/lib/ai-fraud";
import { logAiDecision } from "@/lib/ai/logger";

export const dynamic = "force-dynamic";

/** POST /api/ai/fraud-check – risk score and recommended action for listing, booking, or user. */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { listingId, bookingId, userId, signals, store } = body;
    const hasListing = listingId && typeof listingId === "string";
    const hasInlineSignals = Array.isArray(signals) && signals.length > 0;
    const entityType = bookingId ? "BOOKING" : userId ? "USER" : "BOOKING";
    const entityId = bookingId ?? userId ?? "unknown";

    if (hasListing) {
      const result = await fraudCheckListing(listingId, { store: !!store, log: true });
      return Response.json({
        riskScore: result.riskScore,
        trustLevel: result.trustLevel,
        recommendedAction: result.recommendedAction,
        factors: result.factors,
        alertsTriggered: result.alertsTriggered,
        priority: result.riskScore >= 70 ? "high" : result.riskScore >= 40 ? "medium" : "low",
      });
    }

    if (entityId === "unknown" && !hasInlineSignals) {
      return Response.json(
        { error: "listingId, bookingId, userId, or signals required" },
        { status: 400 }
      );
    }

    let score: number;
    let priority: "HIGH" | "MEDIUM" | "LOW";
    let factors: Record<string, number>;

    if (hasInlineSignals) {
      const parsed = (signals as { type?: string; score?: number }[]).map((s) => ({
        type: String(s.type ?? ""),
        score: Math.min(1, Math.max(0, Number(s.score) || 0)),
      }));
      const result = computeFraudScoreFromSignals(parsed);
      score = result.score;
      priority = result.priority;
      factors = result.factors;
    } else {
      const result = await computeFraudScore({ entityType, entityId });
      score = result.score;
      priority = result.priority;
      factors = result.factors;
    }

    if (store && (bookingId || userId)) {
      await evaluateAndStoreFraudScore({
        entityType,
        entityId,
        logDecision: true,
      });
    }

    const riskScore100 = Math.round(score * 100);
    const recommendedAction = score >= 0.7 ? "block" : score >= 0.4 ? "review" : "allow";
    const trustLevel = riskScore100 >= 70 ? "low" : riskScore100 >= 30 ? "medium" : "high";
    await logAiDecision({
      action: "fraud_check",
      entityType: entityType.toLowerCase(),
      entityId,
      riskScore: riskScore100,
      trustLevel,
      details: {
        recommendedAction,
        factors: Object.entries(factors).map(([k, v]) => `${k}: ${(v * 100).toFixed(0)}%`),
      },
    });
    return Response.json({
      riskScore: Math.round(score * 100) / 100,
      recommendedAction,
      factors:
        Object.keys(factors).length > 0
          ? Object.entries(factors).map(([k, v]) => `${k}: ${(v * 100).toFixed(0)}%`)
          : ["No strong signals"],
      priority: priority.toLowerCase(),
      trustLevel,
    });
  } catch (e) {
    console.error(e);
    return Response.json(
      { error: "Failed to run fraud check" },
      { status: 500 }
    );
  }
}
