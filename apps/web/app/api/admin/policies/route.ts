import { NextRequest } from "next/server";
import { getAllPolicyRules, upsertPolicyRule } from "@/lib/policy-engine";
import type { PolicyRuleType, PolicyEffect } from "@prisma/client";

export const dynamic = "force-dynamic";

/** GET: all active policy rules. */
export async function GET() {
  try {
    const rules = await getAllPolicyRules();
    return Response.json(rules);
  } catch (e) {
    console.error(e);
    return Response.json({ error: "Failed to get policy rules" }, { status: 500 });
  }
}

/** POST: create or update policy rule (admin). */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const key = body?.key;
    const name = body?.name;
    const ruleType = body?.ruleType as PolicyRuleType | undefined;
    const effect = body?.effect as PolicyEffect | undefined;
    const conditions = body?.conditions;
    if (!key || !name || !ruleType || !effect || typeof conditions !== "object") {
      return Response.json({
        error: "key, name, ruleType, effect, conditions required",
      }, { status: 400 });
    }
    const rule = await upsertPolicyRule({
      key,
      name,
      description: body.description,
      ruleType,
      scope: body.scope,
      scopeValue: body.scopeValue,
      conditions,
      effect,
      effectPayload: body.effectPayload,
      active: body.active,
      updatedBy: body.updatedBy,
    });
    return Response.json(rule);
  } catch (e) {
    console.error(e);
    return Response.json({ error: "Failed to upsert policy rule" }, { status: 500 });
  }
}
