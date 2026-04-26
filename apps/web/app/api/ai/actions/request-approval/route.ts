import { NextResponse } from "next/server";
import { z } from "zod";
import { getGuestId } from "@/lib/auth/session";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();
import { classifyActionKey } from "@/lib/ai/policies/action-policy";
import { getManagerAiPlatformSettings } from "@/lib/manager-ai/platform-settings";

export const dynamic = "force-dynamic";

const BodyZ = z.object({
  actionKey: z.string().min(1),
  targetEntityType: z.string().min(1),
  targetEntityId: z.string().min(1),
  confidence: z.number().optional(),
  payload: z.record(z.string(), z.unknown()).optional(),
});

export async function POST(req: Request) {
  const userId = await getGuestId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = BodyZ.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }
  if (classifyActionKey(parsed.data.actionKey) === "forbidden") {
    return NextResponse.json({ error: "forbidden_action" }, { status: 400 });
  }

  const row = await prisma.managerAiApprovalRequest.create({
    data: {
      requesterId: userId,
      actionKey: parsed.data.actionKey,
      targetEntityType: parsed.data.targetEntityType,
      targetEntityId: parsed.data.targetEntityId,
      status: "pending",
      confidence: parsed.data.confidence,
      payload: parsed.data.payload as object | undefined,
    },
  });

  const settings = await getManagerAiPlatformSettings();
  if (settings.notifyOnApproval) {
    const admins = await prisma.user.findMany({ where: { role: "ADMIN" }, take: 20, select: { id: true } });
    for (const a of admins) {
      await prisma.managerAiNotificationLog.create({
        data: {
          userId: a.id,
          channel: "in_app",
          type: "approval_pending",
          payload: { approvalId: row.id, actionKey: parsed.data.actionKey } as object,
          status: "queued",
        },
      });
    }
  }

  return NextResponse.json({
    id: row.id,
    status: row.status,
  });
}
