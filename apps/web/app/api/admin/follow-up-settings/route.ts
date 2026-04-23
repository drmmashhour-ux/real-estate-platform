import { NextRequest } from "next/server";
import { prisma } from "@repo/db";
import { getGuestId } from "@/lib/auth/session";
import { getFollowUpSettings, updateFollowUpSettings } from "@/lib/ai/follow-up/settings";

export const dynamic = "force-dynamic";

async function requireAdmin() {
  const userId = await getGuestId();
  if (!userId) return null;
  const u = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  if (u?.role !== "ADMIN") return null;
  return userId;
}

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return Response.json({ error: "Admin only" }, { status: 403 });
  const s = await getFollowUpSettings();
  return Response.json({ settings: s });
}

export async function PATCH(request: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return Response.json({ error: "Admin only" }, { status: 403 });
  const body = await request.json().catch(() => ({}));
  const updated = await updateFollowUpSettings({
    enableWhatsapp: typeof body.enableWhatsapp === "boolean" ? body.enableWhatsapp : undefined,
    enableSms: typeof body.enableSms === "boolean" ? body.enableSms : undefined,
    enableVoice: typeof body.enableVoice === "boolean" ? body.enableVoice : undefined,
    minutesToSecondTouch:
      typeof body.minutesToSecondTouch === "number" ? Math.min(120, Math.max(5, body.minutesToSecondTouch)) : undefined,
    hoursToDayOneTouch:
      typeof body.hoursToDayOneTouch === "number" ? Math.min(168, Math.max(1, body.hoursToDayOneTouch)) : undefined,
    daysToFinalTouch:
      typeof body.daysToFinalTouch === "number" ? Math.min(30, Math.max(1, body.daysToFinalTouch)) : undefined,
    hotScoreThreshold:
      typeof body.hotScoreThreshold === "number" ? Math.min(100, Math.max(50, body.hotScoreThreshold)) : undefined,
    requireExplicitConsent:
      typeof body.requireExplicitConsent === "boolean" ? body.requireExplicitConsent : undefined,
    brokerNotifyEmail: typeof body.brokerNotifyEmail === "boolean" ? body.brokerNotifyEmail : undefined,
    voiceDelayMinutes:
      typeof body.voiceDelayMinutes === "number" ? Math.min(120, Math.max(1, body.voiceDelayMinutes)) : undefined,
    templatesJson: typeof body.templatesJson === "object" && body.templatesJson ? body.templatesJson : undefined,
  });
  return Response.json({ settings: updated });
}
