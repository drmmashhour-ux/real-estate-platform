import { NextResponse } from "next/server";
import { z } from "zod";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import {
  getHostAutopilotConfig,
  updateHostAutopilotConfig,
} from "@/lib/ai/autopilot/host-config";
import type { GuestMessageTriggersState } from "@/lib/ai/messaging/trigger-config";

export const dynamic = "force-dynamic";

const AutopilotModeZ = z.enum(["OFF", "ASSIST", "SAFE_AUTOPILOT", "FULL_AUTOPILOT_APPROVAL"]);

const PatchZ = z.object({
  autopilotEnabled: z.boolean().optional(),
  autopilotMode: AutopilotModeZ.optional(),
  autoPricing: z.boolean().optional(),
  autoMessaging: z.boolean().optional(),
  autoPromotions: z.boolean().optional(),
  autoListingOptimization: z.boolean().optional(),
  autoGuestMessagingEnabled: z.boolean().optional(),
  guestMessageMode: z.enum(["draft_only", "auto_send_safe"]).optional(),
  hostInternalChecklistEnabled: z.boolean().optional(),
  guestMessageTriggers: z.record(z.string(), z.object({ enabled: z.boolean() })).optional(),
});

async function requireHost(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true, _count: { select: { shortTermListings: true } } },
  });
  if (!user) return null;
  const ok = user.role === "HOST" || user.role === "ADMIN" || user._count.shortTermListings > 0;
  return ok ? user : null;
}

export async function GET() {
  const userId = await getGuestId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!(await requireHost(userId))) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const cfg = await getHostAutopilotConfig(userId);
  return NextResponse.json({ settings: cfg });
}

export async function PATCH(req: Request) {
  const userId = await getGuestId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!(await requireHost(userId))) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = PatchZ.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  const { guestMessageTriggers, ...rest } = parsed.data;
  const cfg = await updateHostAutopilotConfig(userId, {
    ...rest,
    ...(guestMessageTriggers
      ? { guestMessageTriggers: guestMessageTriggers as Partial<GuestMessageTriggersState> }
      : {}),
  });
  return NextResponse.json({ settings: cfg });
}
