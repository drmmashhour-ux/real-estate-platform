import { sendRetentionWeMissYouNudge } from "@/lib/ai/productIntelligence";
import { requireAdminSession } from "@/lib/admin/require-admin";
import { getLegacyDB } from "@/lib/db/legacy";
import { trackEvent } from "@/src/services/analytics";

export const dynamic = "force-dynamic";

/**
 * ORDER SYBNB-AI-120 — single-user in-app nudge (manual, admin-only). No bulk.
 */
export async function POST(req: Request) {
  const admin = await requireAdminSession();
  if (!admin.ok) {
    return Response.json({ error: admin.error }, { status: admin.status });
  }

  let body: { userId?: unknown };
  try {
    body = (await req.json()) as { userId?: unknown };
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const userId = typeof body.userId === "string" ? body.userId.trim() : "";
  if (!userId) {
    return Response.json({ error: "userId is required" }, { status: 400 });
  }

  const prisma = getLegacyDB();
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true } });
  if (!user) {
    return Response.json({ error: "User not found" }, { status: 404 });
  }

  sendRetentionWeMissYouNudge(userId);
  void trackEvent(
    "product_intelligence_retention_nudge_sent",
    { targetUserId: userId },
    { userId: admin.userId },
  );

  return Response.json({ ok: true }, { headers: { "Cache-Control": "private, no-store" } });
}
