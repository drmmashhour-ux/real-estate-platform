import { NextResponse } from "next/server";

import { getGuestId } from "@/lib/auth/session";
import { brokerClosingFlags } from "@/config/feature-flags";
import { recordFollowUpDraftOpenedMonitored } from "@/modules/broker/closing/broker-closing-monitoring.service";
import {
  recordConversionConsoleOpened,
  recordConversionDraftOpened,
  recordConversionFocusLead,
  recordConversionNextActionExecuted,
  recordConversionSessionCompleted,
  recordConversionSessionStarted,
} from "@/modules/broker/closing/broker-conversion-console-monitoring.service";

export const dynamic = "force-dynamic";

/** Lightweight client telemetry — closing feature only; never throws upstream. */
export async function POST(req: Request) {
  if (!brokerClosingFlags.brokerClosingV1) {
    return NextResponse.json({ ok: false }, { status: 404 });
  }

  const userId = await getGuestId();
  if (!userId) return NextResponse.json({ ok: false }, { status: 401 });

  let body: { event?: unknown; leadId?: unknown; action?: unknown };
  try {
    body = (await req.json()) as { event?: unknown; leadId?: unknown; action?: unknown };
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  if (body.event === "followup_draft_opened") {
    recordFollowUpDraftOpenedMonitored();
  }

  if (body.event === "conversion_console_opened") recordConversionConsoleOpened();
  if (body.event === "conversion_focus_lead" && typeof body.leadId === "string") {
    recordConversionFocusLead(body.leadId);
  }
  if (body.event === "conversion_next_action_executed" && typeof body.action === "string") {
    recordConversionNextActionExecuted(body.action);
  }
  if (body.event === "conversion_draft_opened") recordConversionDraftOpened();
  if (body.event === "conversion_session_started") recordConversionSessionStarted();
  if (body.event === "conversion_session_completed") recordConversionSessionCompleted();

  return NextResponse.json({ ok: true });
}
