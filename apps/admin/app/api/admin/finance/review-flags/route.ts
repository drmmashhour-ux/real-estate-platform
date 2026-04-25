import { NextRequest } from "next/server";
import { getFinanceActor } from "@/lib/admin/finance-request";
import { logFinancialAction } from "@/lib/admin/financial-audit";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const actor = await getFinanceActor();
  if (!actor) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await request.json().catch(() => null)) as
    | {
        entityType?: string;
        entityId?: string;
        reason?: string;
        note?: string;
      }
    | null;

  if (!body?.entityType || !body?.entityId) {
    return Response.json({ error: "entityType and entityId are required" }, { status: 400 });
  }

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;

  await logFinancialAction({
    actorUserId: actor.user.id,
    action: "finance_manual_review_requested",
    entityType: body.entityType,
    entityId: body.entityId,
    ipAddress: ip,
    metadata: {
      reason: body.reason ?? null,
      note: body.note ?? null,
    },
  });

  return Response.json({ ok: true });
}
