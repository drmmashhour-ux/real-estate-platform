import type { CareHubEventKind, CareHubEventSeverity } from "@prisma/client";

import { getMobileAuthUser } from "@/modules/auth/mobile-auth";
import { resolveViewerForResident } from "@/modules/soins/soins-access.service";
import { createCareEvent, listCareEvents } from "@/modules/soins/soins-events.service";

import { jsonError, readJson } from "../_http";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const auth = await getMobileAuthUser(request);
  if (!auth) return jsonError(401, "Unauthorized");

  const url = new URL(request.url);
  const residentId = url.searchParams.get("residentId");
  if (!residentId) return jsonError(400, "residentId query required");

  const gate = await resolveViewerForResident(auth, residentId);
  if (!gate) return jsonError(403, "Forbidden");

  const limit = Math.min(Number(url.searchParams.get("limit") ?? "50") || 50, 200);
  const events = await listCareEvents(residentId, limit);
  return Response.json({ events });
}

export async function POST(request: Request) {
  const auth = await getMobileAuthUser(request);
  if (!auth) return jsonError(401, "Unauthorized");

  const body = await readJson<{
    residentId: string;
    type: CareHubEventKind;
    message: string;
    severity: CareHubEventSeverity;
    alertCode?: string;
    skipNotifications?: boolean;
  }>(request);

  if (!body?.residentId || !body.type || !body.message || !body.severity) {
    return jsonError(400, "residentId, type, message, severity required");
  }

  const gate = await resolveViewerForResident(auth, body.residentId);
  if (!gate || gate.role === "family") return jsonError(403, "Forbidden");

  const row = await createCareEvent({
    residentId: body.residentId,
    type: body.type,
    message: body.message,
    severity: body.severity,
    alertCode: body.alertCode,
    skipNotifications: body.skipNotifications,
  });

  return Response.json({ event: row });
}
