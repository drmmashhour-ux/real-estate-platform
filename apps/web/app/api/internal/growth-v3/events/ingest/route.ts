import { NextRequest } from "next/server";
import { cronNotConfigured, cronUnauthorized, verifyCronBearer } from "@/lib/server/internal-cron-auth";
import { ingestGrowthEvent } from "@/src/modules/events/event.ingestor";
import { GROWTH_EVENT_NAMES } from "@/src/modules/events/event.types";

export const dynamic = "force-dynamic";

type Body = {
  name: string;
  userId?: string | null;
  sessionId?: string | null;
  entityType?: string | null;
  entityId?: string | null;
  payload?: Record<string, unknown>;
};

/**
 * POST /api/internal/growth-v3/events/ingest — normalized growth signals (Bearer CRON_SECRET).
 */
export async function POST(request: NextRequest) {
  if (!process.env.CRON_SECRET?.trim()) return cronNotConfigured();
  if (!verifyCronBearer(request)) return cronUnauthorized();

  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body?.name || typeof body.name !== "string") {
    return Response.json({ error: "name required" }, { status: 400 });
  }

  const known = GROWTH_EVENT_NAMES.includes(body.name as (typeof GROWTH_EVENT_NAMES)[number]);
  if (!known) {
    return Response.json({ error: "unknown event name", allowed: GROWTH_EVENT_NAMES }, { status: 400 });
  }

  const r = await ingestGrowthEvent({
    name: body.name,
    userId: body.userId ?? undefined,
    sessionId: body.sessionId ?? undefined,
    entityType: body.entityType ?? undefined,
    entityId: body.entityId ?? undefined,
    payload: body.payload,
  });

  if (!r) {
    return Response.json({ ok: false, reason: "FEATURE_GROWTH_SIGNAL_STREAM_V1 off or persist failed" }, { status: 202 });
  }

  return Response.json({ ok: true, id: r.id });
}
