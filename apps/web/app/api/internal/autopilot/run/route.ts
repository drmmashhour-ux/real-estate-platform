import { NextRequest } from "next/server";
import {
  cronNotConfigured,
  cronUnauthorized,
  verifyCronBearer,
} from "@/lib/server/internal-cron-auth";
import {
  runLecipmCoreAutopilotEvent,
  runFsboListingAutopilotSampleScan,
} from "@/src/modules/autopilot/autopilot.service";
import type { LecipmCoreAutopilotEventPayload } from "@/src/modules/autopilot/types";

export const dynamic = "force-dynamic";

/**
 * POST /api/internal/autopilot/run — core autopilot (Bearer CRON_SECRET).
 * Body: { scan?: "fsbo_sample", limit?: number } | LecipmCoreAutopilotEventPayload
 */
export async function POST(request: NextRequest) {
  if (!process.env.CRON_SECRET?.trim()) return cronNotConfigured();
  if (!verifyCronBearer(request)) return cronUnauthorized();

  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;

  if (body.scan === "fsbo_sample") {
    const limit = typeof body.limit === "number" ? body.limit : 40;
    const r = await runFsboListingAutopilotSampleScan(Math.min(200, limit));
    return Response.json({ ok: true, ...r });
  }

  const payload = body as LecipmCoreAutopilotEventPayload;
  if (!payload.eventType || typeof payload.eventType !== "string") {
    return Response.json({ ok: false, error: "eventType required" }, { status: 400 });
  }

  const result = await runLecipmCoreAutopilotEvent(payload);
  return Response.json(result);
}
