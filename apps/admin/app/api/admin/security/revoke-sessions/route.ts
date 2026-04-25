import { NextRequest } from "next/server";
import { requireAdminSession } from "@/lib/admin/require-admin";
import { prisma } from "@repo/db";
import { securityLog } from "@/lib/security/security-logger";

export const dynamic = "force-dynamic";

/** POST { userId } — revoke all sessions (force logout everywhere cookies apply). */
export async function POST(request: NextRequest) {
  const auth = await requireAdminSession();
  if (!auth.ok) return Response.json({ error: auth.error }, { status: auth.status });
  try {
    const body = (await request.json()) as { userId?: string };
    const userId = typeof body.userId === "string" ? body.userId.trim() : "";
    if (!userId) return Response.json({ error: "userId required" }, { status: 400 });
    const result = await prisma.session.updateMany({
      where: { userId, revoked: false },
      data: { revoked: true },
    });
    void securityLog({
      event: "admin_action",
      detail: "force_logout_sessions",
      persist: true,
      entityId: userId,
      subjectHint: auth.userId,
      payload: { count: result.count },
    });
    return Response.json({ ok: true, sessionsRevoked: result.count });
  } catch (e) {
    console.error(e);
    return Response.json({ error: "Failed" }, { status: 500 });
  }
}
