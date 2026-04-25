import { NextRequest } from "next/server";
import { evaluateRule, evaluatePolicies } from "@/lib/policy-engine";

export const dynamic = "force-dynamic";

/** POST: evaluate a rule or multiple rules (for testing/admin). */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const context = body?.context;
    const ruleKey = body?.ruleKey;
    const ruleKeys = body?.ruleKeys;
    if (!context || typeof context !== "object") {
      return Response.json({ error: "context required" }, { status: 400 });
    }
    if (ruleKeys && Array.isArray(ruleKeys)) {
      const decision = await evaluatePolicies(ruleKeys, context);
      return Response.json(decision);
    }
    if (ruleKey) {
      const decision = await evaluateRule(ruleKey, context);
      return Response.json(decision);
    }
    return Response.json({ error: "ruleKey or ruleKeys required" }, { status: 400 });
  } catch (e) {
    console.error(e);
    return Response.json({ error: "Failed to evaluate policy" }, { status: 500 });
  }
}
