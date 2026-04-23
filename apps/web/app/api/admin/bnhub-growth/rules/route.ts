import { NextRequest } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { assertGrowthAdmin, GrowthAuthError } from "@/src/modules/bnhub-growth-engine/services/growthAccess";
import { prisma } from "@repo/db";
import type { BnhubGrowthRuleScopeType, BnhubGrowthRuleTriggerType } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await assertGrowthAdmin(await getGuestId());
    const rules = await prisma.bnhubGrowthRule.findMany({ orderBy: { createdAt: "desc" } });
    return Response.json({ rules });
  } catch (e) {
    if (e instanceof GrowthAuthError) {
      return Response.json({ error: e.message }, { status: e.code === "UNAUTHORIZED" ? 401 : 403 });
    }
    console.error(e);
    return Response.json({ error: "Failed" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await assertGrowthAdmin(await getGuestId());
    const body = (await request.json()) as {
      scopeType: BnhubGrowthRuleScopeType;
      scopeId?: string | null;
      ruleName: string;
      triggerType: BnhubGrowthRuleTriggerType;
      isEnabled?: boolean;
    };
    const r = await prisma.bnhubGrowthRule.create({
      data: {
        scopeType: body.scopeType,
        scopeId: body.scopeId,
        ruleName: body.ruleName,
        triggerType: body.triggerType,
        isEnabled: body.isEnabled ?? true,
        conditionsJson: {},
        actionsJson: {},
      },
    });
    return Response.json(r);
  } catch (e) {
    if (e instanceof GrowthAuthError) {
      return Response.json({ error: e.message }, { status: e.code === "UNAUTHORIZED" ? 401 : 403 });
    }
    console.error(e);
    return Response.json({ error: "Failed" }, { status: 400 });
  }
}
