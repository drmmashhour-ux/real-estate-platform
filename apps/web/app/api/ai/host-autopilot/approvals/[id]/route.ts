import { NextResponse } from "next/server";
import { z } from "zod";
import { getGuestId } from "@/lib/auth/session";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();
import { logManagerAction } from "@/lib/ai/logger";
import { applyHostAutopilotApproval } from "@/lib/ai/autopilot/apply-approval";
import { notifyHostAutopilot } from "@/lib/ai/autopilot/notify-host";
import {
  approvalOutcomeAfterApply,
  recordHostAutopilotApprovalReview,
} from "@/lib/ai/learning/host-autopilot-flow-hooks";
import { translateServer } from "@/lib/i18n/server-translate";
import { getUserUiLocaleCode } from "@/lib/i18n/user-ui-locale";
import { logAutopilotTagged } from "@/lib/server/launch-logger";

export const dynamic = "force-dynamic";

const BodyZ = z.object({
  decision: z.enum(["approve", "reject", "modify"]),
  note: z.string().max(2000).optional(),
  /** Shallow-merge into stored approval payload (host-adjusted proposal). */
  modifiedPayloadJson: z.string().max(8000).optional(),
});

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getGuestId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = BodyZ.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "Invalid body" }, { status: 400 });

  const row = await prisma.managerAiApprovalRequest.findUnique({ where: { id } });
  if (!row || row.requesterId !== userId) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  if (row.status !== "pending") {
    return NextResponse.json({ error: "not_pending" }, { status: 400 });
  }

  if (parsed.data.decision === "modify") {
    let extra: Record<string, unknown> | undefined;
    const rawJson = parsed.data.modifiedPayloadJson?.trim();
    const note = parsed.data.note?.trim();
    if (rawJson) {
      try {
        const parsedJson = JSON.parse(rawJson) as unknown;
        if (parsedJson && typeof parsedJson === "object" && !Array.isArray(parsedJson)) {
          extra = parsedJson as Record<string, unknown>;
        } else {
          return NextResponse.json({ error: "modified_payload_must_be_object" }, { status: 400 });
        }
      } catch {
        return NextResponse.json({ error: "invalid_modified_json" }, { status: 400 });
      }
    }
    if (!extra && !note) {
      return NextResponse.json({ error: "provide_json_or_note" }, { status: 400 });
    }
    const base =
      row.payload && typeof row.payload === "object" && !Array.isArray(row.payload)
        ? { ...(row.payload as object) }
        : {};
    const merged = extra
      ? { ...base, ...extra, hostModifiedAt: new Date().toISOString() }
      : base;
    await prisma.managerAiApprovalRequest.update({
      where: { id: row.id },
      data: {
        payload: merged as object,
        reviewNote: note ?? row.reviewNote,
      },
    });
    logAutopilotTagged.info("action_suggested", {
      event: "approval_payload_amended",
      approvalId: row.id,
      hostId: userId,
      actionKey: row.actionKey,
    });
    return NextResponse.json({ ok: true, status: "modified" });
  }

  if (parsed.data.decision === "reject") {
    await prisma.managerAiApprovalRequest.update({
      where: { id: row.id },
      data: {
        status: "rejected",
        reviewerId: userId,
        reviewNote: parsed.data.note ?? null,
        reviewedAt: new Date(),
      },
    });
    await logManagerAction({
      userId,
      actionKey: `host_autopilot_approval_rejected:${row.actionKey}`,
      targetEntityType: row.targetEntityType,
      targetEntityId: row.targetEntityId,
      status: "rejected",
      payload: { approvalId: row.id, note: parsed.data.note },
      approvalId: row.id,
    });
    try {
      await recordHostAutopilotApprovalReview({
        hostId: userId,
        row,
        outcomeType: "rejected",
      });
    } catch {
      /* learning must not affect approval flow */
    }
    logAutopilotTagged.info("action_rejected", {
      approvalId: row.id,
      hostId: userId,
      actionKey: row.actionKey,
      targetEntityType: row.targetEntityType,
      targetEntityId: row.targetEntityId,
    });
    return NextResponse.json({ ok: true, status: "rejected" });
  }

  if (parsed.data.decision !== "approve") {
    return NextResponse.json({ error: "invalid_decision" }, { status: 400 });
  }

  const applied =
    row.targetEntityType === "short_term_listing"
      ? await applyHostAutopilotApproval({
          hostId: userId,
          listingId: row.targetEntityId,
          payload: row.payload,
        })
      : { ok: true as const };

  await prisma.managerAiApprovalRequest.update({
    where: { id: row.id },
    data: {
      status: "approved",
      reviewerId: userId,
      reviewNote: parsed.data.note ?? null,
      reviewedAt: new Date(),
      result: { applied: applied.ok } as object,
    },
  });

  await logManagerAction({
    userId,
    actionKey: `host_autopilot_approval_approved:${row.actionKey}`,
    targetEntityType: row.targetEntityType,
    targetEntityId: row.targetEntityId,
    status: applied.ok ? "executed" : "failed",
    payload: { approvalId: row.id, note: parsed.data.note },
    approvalId: row.id,
    error: applied.ok ? undefined : { error: "apply_failed" },
  });

  try {
    await recordHostAutopilotApprovalReview({
      hostId: userId,
      row,
      outcomeType: approvalOutcomeAfterApply(row, applied.ok),
    });
  } catch {
    /* learning must not affect approval flow */
  }

  logAutopilotTagged.info("action_applied", {
    approvalId: row.id,
    hostId: userId,
    actionKey: row.actionKey,
    targetEntityType: row.targetEntityType,
    targetEntityId: row.targetEntityId,
    applied: applied.ok,
  });

  const loc = await getUserUiLocaleCode(userId);
  await notifyHostAutopilot({
    userId,
    locale: loc,
    title: applied.ok
      ? translateServer(loc, "autopilot.approvalAppliedNotifyTitle")
      : translateServer(loc, "autopilot.approvalRecordedNotifyTitle"),
    message: applied.ok
      ? translateServer(loc, "autopilot.approvalAppliedNotifyMessage")
      : translateServer(loc, "autopilot.approvalRecordedNotifyMessage"),
  });

  return NextResponse.json({ ok: true, status: "approved", applied: applied.ok });
}
