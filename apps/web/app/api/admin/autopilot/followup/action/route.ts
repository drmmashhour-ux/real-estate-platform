import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/admin/require-admin";
import { prisma } from "@/lib/db";
import { mergeAiFollowUpIntoExplanation, parseAiFollowUpFromExplanation } from "@/modules/growth/ai-autopilot-followup-persist";
import type { AiFollowUpState } from "@/modules/growth/ai-autopilot-followup.types";
import { recordMarkedDone, recordSnoozed } from "@/modules/growth/ai-autopilot-followup-monitoring.service";

/**
 * Internal-only follow-up actions — updates `aiExplanation.aiFollowUp` only; no outbound messaging.
 */
export async function POST(req: Request) {
  const session = await requireAdminSession();
  if (!session.ok) {
    return NextResponse.json({ error: session.error }, { status: session.status });
  }

  let body: { leadId?: string; action?: string };
  try {
    body = (await req.json()) as { leadId?: string; action?: string };
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.leadId || typeof body.leadId !== "string") {
    return NextResponse.json({ error: "leadId required" }, { status: 400 });
  }

  const lead = await prisma.lead.findUnique({
    where: { id: body.leadId },
    select: { aiExplanation: true },
  });
  if (!lead) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const nowIso = new Date().toISOString();
  let next: AiFollowUpState;

  if (body.action === "mark_done") {
    next = {
      version: "v1",
      status: "done",
      followUpPriority: "low",
      updatedAt: nowIso,
    };
    recordMarkedDone();
  } else if (body.action === "snooze") {
    const until = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    next = {
      version: "v1",
      status: "waiting",
      nextActionAt: until,
      followUpPriority: "medium",
      reminderReason: "Snoozed internally (+24h)",
      updatedAt: nowIso,
    };
    recordSnoozed();
  } else if (body.action === "requeue") {
    const prior = parseAiFollowUpFromExplanation(lead.aiExplanation);
    next = {
      version: "v1",
      status: "queued",
      followUpPriority: prior?.followUpPriority ?? "medium",
      queueScore: prior?.queueScore,
      updatedAt: nowIso,
      reminderReason: "Re-queued internally",
    };
  } else {
    return NextResponse.json({ error: "bad_action" }, { status: 400 });
  }

  await prisma.lead.update({
    where: { id: body.leadId },
    data: {
      aiLastUpdated: new Date(),
      aiExplanation: mergeAiFollowUpIntoExplanation(lead.aiExplanation, next),
    },
  });

  return NextResponse.json({ ok: true });
}
