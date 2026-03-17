import { NextRequest } from "next/server";
import {
  createCrisisEvent,
  getActiveCrisisEvents,
  getCrisisTimeline,
  resolveCrisisEvent,
  logCrisisAction,
  applyEmergencyBookingFreeze,
  applyEmergencyPayoutFreeze,
} from "@/lib/defense/crisis-response";
import type { CrisisSeverity } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const crisisId = searchParams.get("crisisId");
    if (crisisId) {
      const timeline = await getCrisisTimeline(crisisId);
      return Response.json(timeline);
    }
    const events = await getActiveCrisisEvents();
    return Response.json(events);
  } catch (e) {
    console.error(e);
    return Response.json({ error: "Failed to get crisis data" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const action = body.action; // create | resolve | log_action | booking_freeze | payout_freeze
    if (action === "create") {
      const { title, severity, region, playbookRef, summary } = body;
      if (!title || !severity) {
        return Response.json({ error: "title, severity required" }, { status: 400 });
      }
      const event = await createCrisisEvent({
        title,
        severity: severity as CrisisSeverity,
        region,
        playbookRef,
        summary,
      });
      return Response.json(event);
    }
    if (action === "resolve") {
      const { id, resolvedBy, summary } = body;
      if (!id || !resolvedBy) {
        return Response.json({ error: "id, resolvedBy required" }, { status: 400 });
      }
      const event = await resolveCrisisEvent(id, resolvedBy, summary);
      return Response.json(event);
    }
    if (action === "log_action") {
      const { crisisId, actionType, targetType, targetId, performedBy, reasonCode, payload } = body;
      if (!crisisId || !actionType || !performedBy) {
        return Response.json({ error: "crisisId, actionType, performedBy required" }, { status: 400 });
      }
      const log = await logCrisisAction({
        crisisId,
        actionType,
        targetType,
        targetId,
        performedBy,
        reasonCode,
        payload,
      });
      return Response.json(log);
    }
    if (action === "booking_freeze") {
      const { crisisId, region, performedBy } = body;
      if (!crisisId || !region || !performedBy) {
        return Response.json({ error: "crisisId, region, performedBy required" }, { status: 400 });
      }
      const control = await applyEmergencyBookingFreeze(region, performedBy, crisisId);
      return Response.json(control);
    }
    if (action === "payout_freeze") {
      const { crisisId, region, performedBy } = body;
      if (!crisisId || !region || !performedBy) {
        return Response.json({ error: "crisisId, region, performedBy required" }, { status: 400 });
      }
      const control = await applyEmergencyPayoutFreeze(region, performedBy, crisisId);
      return Response.json(control);
    }
    return Response.json({ error: "Unknown action" }, { status: 400 });
  } catch (e) {
    console.error(e);
    return Response.json({ error: "Failed to perform crisis action" }, { status: 500 });
  }
}
