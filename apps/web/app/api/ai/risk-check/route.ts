import { NextRequest } from "next/server";
import { isAiManagerEnabled, callAiManager } from "@/lib/ai-manager-client";
import {
  computeFraudScoreFromSignals,
  computeFraudScore,
  evaluateAndStoreFraudScore,
} from "@/lib/ai-fraud";

export const dynamic = "force-dynamic";

/** POST /api/ai/risk-check – fraud risk score and recommended action. */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { bookingId, userId, signals, paymentAttempts, accountAgeDays, store } = body;

    if (isAiManagerEnabled()) {
      const result = await callAiManager<{
        fraudRiskScore: number;
        recommendedAction: string;
        factors: string[];
        priority: string;
      }>("/v1/ai-manager/risk-check", {
        bookingId,
        userId,
        signals,
        paymentAttempts,
        accountAgeDays,
      });
      return Response.json(result);
    }

    const entityType = bookingId ? "BOOKING" : userId ? "USER" : "BOOKING";
    const entityId = bookingId ?? userId ?? "unknown";
    const hasSignals = Array.isArray(signals) && signals.length > 0;

    let score: number;
    let priority: "HIGH" | "MEDIUM" | "LOW";
    let factors: Record<string, number> | string[];

    if (hasSignals) {
      const parsed = (signals as { type?: string; score?: number }[]).map((s) => ({
        type: String(s.type ?? ""),
        score: Math.min(1, Math.max(0, Number(s.score) ?? 0)),
      }));
      const result = computeFraudScoreFromSignals(parsed);
      score = result.score;
      priority = result.priority;
      factors = Object.entries(result.factors).map(([k, v]) => `${k}: ${(v * 100).toFixed(0)}%`);
    } else if (entityId !== "unknown") {
      const result = await computeFraudScore({ entityType, entityId });
      score = result.score;
      priority = result.priority;
      factors = Object.entries(result.factors).map(([k, v]) => `${k}: ${(v * 100).toFixed(0)}%`);
    } else {
      return Response.json(
        { error: "bookingId, userId, or signals required" },
        { status: 400 }
      );
    }

    if (store && (bookingId || userId)) {
      await evaluateAndStoreFraudScore({
        entityType,
        entityId,
        logDecision: true,
      });
    }

    const recommendedAction =
      score >= 0.7 ? "block" : score >= 0.4 ? "review" : "allow";
    return Response.json({
      fraudRiskScore: Math.round(score * 100) / 100,
      recommendedAction,
      factors: Array.isArray(factors) ? factors : [],
      priority: priority.toLowerCase(),
    });
  } catch (e) {
    console.error(e);
    return Response.json(
      { error: "Failed to run risk check" },
      { status: 500 }
    );
  }
}
