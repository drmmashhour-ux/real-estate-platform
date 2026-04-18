import { NextResponse } from "next/server";
import { engineFlags } from "@/config/feature-flags";
import { buildGrowthPolicyEvaluationContextFromPlatform } from "@/modules/growth/policy/growth-policy-context.service";
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
    return NextResponse.json({
      policies,
      note: "Advisory-only in V1 — does not block ads, CRO, Stripe, or bookings.",
    });
  } catch (e) {
    console.error("[growth:policy]", e);
    return NextResponse.json({ error: "Failed to evaluate policies" }, { status: 500 });
  }
}
