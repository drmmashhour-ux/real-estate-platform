import { NextRequest, NextResponse } from "next/server";
import { PlatformRole } from "@prisma/client";
import { logError } from "@/lib/logger";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import {
  GTM_EVENT_TYPES,
  getGtmExecutionSummary,
  recordGtmExecutionEvent,
} from "@/modules/growth/growth-execution.service";

export const dynamic = "force-dynamic";

async function requireAdmin() {
  const userId = await getGuestId();
  if (!userId) return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) } as const;
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  if (!user || user.role !== PlatformRole.ADMIN) {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) } as const;
  }
  return { userId } as const;
}

/** GET — dashboard summary (KPIs vs plan, funnel counts). */
export async function GET() {
  const gate = await requireAdmin();
  if ("error" in gate) return gate.error;
  try {
    const summary = await getGtmExecutionSummary();
    return NextResponse.json(summary);
  } catch (e) {
    logError("[admin.senior-living.gtm.get]", { error: e });
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

/** POST — log outreach / reply / onboarding / revenue events. Body: { eventType, quantity?, notes?, operatorUserId?, metadata? } */
export async function POST(req: NextRequest) {
  const gate = await requireAdmin();
  if ("error" in gate) return gate.error;

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const eventType = typeof body.eventType === "string" ? body.eventType.trim() : "";
  if (!eventType) return NextResponse.json({ error: "eventType required" }, { status: 400 });

  const allowed = new Set(Object.values(GTM_EVENT_TYPES));
  if (!allowed.has(eventType as (typeof GTM_EVENT_TYPES)[keyof typeof GTM_EVENT_TYPES])) {
    return NextResponse.json({ error: "unknown eventType" }, { status: 400 });
  }

  try {
    const row = await recordGtmExecutionEvent({
      eventType,
      quantity: typeof body.quantity === "number" ? body.quantity : 1,
      notes: typeof body.notes === "string" ? body.notes : null,
      operatorUserId: typeof body.operatorUserId === "string" ? body.operatorUserId : null,
      metadata: typeof body.metadata === "object" && body.metadata !== null ? (body.metadata as Record<string, unknown>) : null,
    });
    return NextResponse.json({ ok: true, id: row.id });
  } catch (e) {
    logError("[admin.senior-living.gtm.post]", { error: e });
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
