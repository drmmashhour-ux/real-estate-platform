import { NextRequest } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { sendEmail } from "@/lib/email/resend";

export const dynamic = "force-dynamic";

/** POST /api/admin/messaging/manual-send — admin-only; bypasses automation rate limit (still logs). */
export async function POST(req: NextRequest) {
  const uid = await getGuestId();
  if (!uid) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const admin = await prisma.user.findUnique({ where: { id: uid }, select: { role: true } });
  if (admin?.role !== "ADMIN") return Response.json({ error: "Forbidden" }, { status: 403 });

  let body: { userId?: string; subject?: string; html?: string };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const userId = typeof body.userId === "string" ? body.userId.trim() : "";
  const subject = typeof body.subject === "string" ? body.subject.trim() : "";
  const html = typeof body.html === "string" ? body.html.trim() : "";
  if (!userId || !subject || !html) {
    return Response.json({ error: "userId, subject, html required" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { id: userId }, select: { email: true } });
  if (!user?.email) return Response.json({ error: "User email not found" }, { status: 404 });

  const ok = await sendEmail({ to: user.email, subject, html });
  if (!ok) return Response.json({ error: "Send failed (Resend not configured?)" }, { status: 502 });

  await prisma.messageLog.create({
    data: {
      userId,
      channel: "email",
      status: "sent",
      subject,
      bodyPreview: html.replace(/<[^>]+>/g, " ").slice(0, 280),
      triggerEvent: "admin_manual",
      metadata: { adminUserId: uid, admin_override: true } as object,
    },
  });

  await prisma.user.update({
    where: { id: userId },
    data: { growthLastContactAt: new Date() },
  });

  return Response.json({ ok: true });
}
