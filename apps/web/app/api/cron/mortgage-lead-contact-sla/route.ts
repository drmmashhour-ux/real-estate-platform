import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { sendDashboardNotification } from "@/lib/notifications";
import { sendEmailNotification } from "@/lib/notifications";

export const dynamic = "force-dynamic";

/**
 * POST /api/cron/mortgage-lead-contact-sla — remind experts & admins when assigned leads sit uncontacted.
 * Authorization: Bearer CRON_SECRET
 */
export async function POST(req: NextRequest) {
  const secret = process.env.CRON_SECRET?.trim();
  const auth = req.headers.get("authorization") ?? "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7).trim() : "";
  if (!secret || token !== secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const cutoff = new Date(Date.now() - 24 * 3600 * 1000);
  const stale = await prisma.lead.findMany({
    where: {
      leadType: "mortgage",
      assignedExpertId: { not: null },
      pipelineStatus: "new",
      lastContactedAt: null,
      mortgageSlaReminderAt: null,
      mortgageAssignedAt: { lte: cutoff },
    },
    take: 40,
    select: {
      id: true,
      name: true,
      email: true,
      assignedExpertId: true,
      revenueTier: true,
    },
  });

  let reminded = 0;
  for (const lead of stale) {
    if (!lead.assignedExpertId) continue;
    await prisma.lead.update({
      where: { id: lead.id },
      data: { mortgageSlaReminderAt: new Date() },
    });

    void sendDashboardNotification({
      mortgageExpertId: lead.assignedExpertId,
      leadId: lead.id,
      kind: "mortgage_lead_sla",
      title: "Follow up: client not contacted",
      body: `${lead.name} — assigned 24h+ ago with no contact logged. Reach out now to protect conversion.${lead.revenueTier === "HIGH" ? " (HIGH tier)" : ""}`,
    });
    reminded++;
  }

  if (reminded > 0) {
    const admins = await prisma.user.findMany({
      where: { role: "ADMIN" },
      select: { email: true },
      take: 8,
    });
    const html = `<p><strong>Mortgage SLA</strong>: ${reminded} assigned lead(s) had no contact after 24h. Experts were nudged in-app.</p>`;
    for (const a of admins) {
      void sendEmailNotification({
        to: a.email,
        subject: `[Platform] Mortgage lead SLA — ${reminded} reminder(s)`,
        html,
      });
    }
  }

  return NextResponse.json({ ok: true, reminded });
}
