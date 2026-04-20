import { NextResponse } from "next/server";
import { engineFlags } from "@/config/feature-flags";
import type { GrowthPolicyActionBundle } from "@/modules/growth/policy/growth-policy-actions.types";
import { buildGrowthPolicyActionBundle } from "@/modules/growth/policy/growth-policy-actions.service";
import { buildGrowthPolicyEvaluationContextFromPlatform } from "@/modules/growth/policy/growth-policy-context.service";
import type { GrowthPolicyHistoryHint } from "@/modules/growth/policy/growth-policy-history.types";
import {
  buildGrowthPolicyHistoryHintsForPolicies,
  recordPolicyEvaluationHistory,
} from "@/modules/growth/policy/growth-policy-history.service";
import { recordPolicyTrendDailySnapshotFromEvaluation } from "@/modules/growth/policy/growth-policy-trend-timeseries.service";
import { evaluateGrowthPolicies } from "@/modules/growth/policy/growth-policy.service";
import { requireGrowthMachineActor } from "@/modules/growth-machine/growth-api-context";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!engineFlags.growthPolicyV1) {
    return NextResponse.json({ error: "Growth policy layer disabled" }, { status: 403 });
  }
  const auth = await requireGrowthMachineActor();
  if (!auth.ok) return auth.response;

  try {
    const context = await buildGrowthPolicyEvaluationContextFromPlatform();
    const policies = evaluateGrowthPolicies(context);
    const payload: {
      policies: typeof policies;
      note: string;
      actionBundle?: GrowthPolicyActionBundle;
      historyHints?: Record<string, GrowthPolicyHistoryHint>;
    } = {
      policies,
      note: "Advisory-only in V1 — does not block ads, CRO, Stripe, or bookings.",
    };
    if (engineFlags.growthPolicyActionsV1) {
      payload.actionBundle = buildGrowthPolicyActionBundle(policies);
    }
    if (engineFlags.growthPolicyHistoryV1) {
      try {
        recordPolicyEvaluationHistory(policies);
        payload.historyHints = buildGrowthPolicyHistoryHintsForPolicies(policies);
      } catch (he) {
        console.error("[growth:policy-history]", he);
      }
    }
    if (engineFlags.growthPolicyTrendsV1) {
      try {
        recordPolicyTrendDailySnapshotFromEvaluation(policies);
      } catch (te) {
        console.error("[growth:policy-trends]", te);
      }
    }
    return NextResponse.json(payload);
  } catch (e) {
    console.error("[growth:policy]", e);
    return NextResponse.json({ error: "Failed to evaluate policies" }, { status: 500 });
  }
}
