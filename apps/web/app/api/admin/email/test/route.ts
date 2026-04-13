/**
 * POST /api/admin/email/test — ADMIN only; verify Resend/SendGrid configuration.
 */

import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getGuestId } from "@/lib/auth/session";
import { sendTransactionalEmail } from "@/lib/email/provider";
import { logFinancialAction } from "@/lib/admin/financial-audit";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const userId = await getGuestId();
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true, email: true },
  });
  if (user?.role !== "ADMIN") {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: { to?: string } = {};
  try {
    body = await request.json();
  } catch {
    /* optional body */
  }
  const to = typeof body.to === "string" && body.to.includes("@") ? body.to.trim() : user.email;
  if (!to) {
    return Response.json({ error: "No recipient" }, { status: 400 });
  }

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
  await logFinancialAction({
    actorUserId: userId,
    action: "admin_email_test",
    ipAddress: ip,
    metadata: { toDomain: to.split("@")[1] ?? "unknown" },
  });

  const ok = await sendTransactionalEmail({
    to,
    subject: "BNHUB — email test",
    template: "admin_test_ping",
    html: `<p>This is a test from BNHUB production email wiring.</p><p>If you received this, outbound mail is working.</p>`,
  });

  return Response.json({ ok, provider: process.env.EMAIL_PROVIDER ?? "auto" });
}
