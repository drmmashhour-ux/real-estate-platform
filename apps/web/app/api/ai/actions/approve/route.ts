import { NextResponse } from "next/server";
import { z } from "zod";
import { getGuestId } from "@/lib/auth/session";
import { isPlatformAdmin } from "@/lib/auth/is-platform-admin";
import { prisma } from "@repo/db";
import { logManagerAction } from "@/lib/ai/logger";
import { logOutcome } from "@/lib/ai/learning/outcome-signals";
import { updateRulePerformance } from "@/lib/ai/learning/rule-performance";

export const dynamic = "force-dynamic";

const BodyZ = z.object({
  id: z.string().min(1),
  note: z.string().optional(),
});

export async function POST(req: Request) {
  const userId = await getGuestId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!(await isPlatformAdmin(userId))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = BodyZ.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "Invalid body" }, { status: 400 });

  const row = await prisma.managerAiApprovalRequest.findUnique({ where: { id: parsed.data.id } });
  if (!row || row.status !== "pending") {
    return NextResponse.json({ error: "not_found_or_not_pending" }, { status: 400 });
  }

  const updated = await prisma.managerAiApprovalRequest.update({
    where: { id: row.id },
    data: {
      status: "approved",
      reviewerId: userId,
      reviewNote: parsed.data.note,
      reviewedAt: new Date(),
    },
  });

  await logManagerAction({
    userId,
    actionKey: `approval:${row.actionKey}`,
    targetEntityType: row.targetEntityType,
    targetEntityId: row.targetEntityId,
    status: "executed",
    payload: { approvalId: row.id, note: parsed.data.note },
    approvalId: row.id,
  });

  try {
    const listingId = row.targetEntityType === "short_term_listing" ? row.targetEntityId : null;
    const bookingId = row.targetEntityType === "booking" ? row.targetEntityId : null;
    await logOutcome({
      hostId: row.requesterId,
      listingId,
      bookingId,
      ruleName: row.actionKey,
      actionType: "platform_admin_approval",
      outcomeType: "approved",
      metadata: { approvalId: row.id, reviewerId: userId },
    });
    await updateRulePerformance(row.actionKey, "approved");
  } catch {
    /* learning must not affect approval flow */
  }

  return NextResponse.json({ ok: true, approval: updated });
}
