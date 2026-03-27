import { NextRequest } from "next/server";
import { getActiveControls, setOperationalControl, getControlAuditLog } from "@/lib/operational-controls";
import type { OperationalControlType } from "@prisma/client";

export const dynamic = "force-dynamic";

/** GET: list active controls (optional ?controlType=, ?targetType=). */
export async function GET(request: NextRequest) {
  try {
    const controlType = request.nextUrl.searchParams.get("controlType") as OperationalControlType | undefined;
    const targetType = request.nextUrl.searchParams.get("targetType") ?? undefined;
    const targetId = request.nextUrl.searchParams.get("targetId") ?? undefined;
    const controls = await getActiveControls(
      controlType && ["KILL_SWITCH", "PAYOUT_HOLD", "LISTING_FREEZE", "BOOKING_RESTRICTION", "MODERATION_LEVEL", "REGIONAL_LOCK"].includes(controlType) ? controlType : undefined,
      targetType,
      targetId
    );
    return Response.json(controls);
  } catch (e) {
    console.error(e);
    return Response.json({ error: "Failed to get controls" }, { status: 500 });
  }
}

/** POST: create or update operational control (admin). */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const controlType = body?.controlType;
    const targetType = body?.targetType;
    const targetId = body?.targetId;
    const active = body?.active !== false;
    const reason = body?.reason;
    const reasonCode = body?.reasonCode;
    const createdBy = body?.createdBy;
    const expiresAt = body?.expiresAt ? new Date(body.expiresAt) : undefined;
    const payload = body?.payload;
    if (!controlType || !targetType) {
      return Response.json({ error: "controlType and targetType required" }, { status: 400 });
    }
    const control = await setOperationalControl({
      controlType,
      targetType,
      targetId,
      payload,
      active,
      reason,
      reasonCode,
      createdBy,
      expiresAt,
    });
    return Response.json(control);
  } catch (e) {
    console.error(e);
    return Response.json({ error: "Failed to set control" }, { status: 500 });
  }
}
