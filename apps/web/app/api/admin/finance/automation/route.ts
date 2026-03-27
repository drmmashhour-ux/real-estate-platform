import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getFinanceActor } from "@/lib/admin/finance-request";
import { isFinancialStaff } from "@/lib/admin/finance-access";
import { logFinancialAction } from "@/lib/admin/financial-audit";
import { sendEmail } from "@/lib/email/send";

export const dynamic = "force-dynamic";

const CRON_SECRET = process.env.CRON_SECRET ?? process.env.FINANCE_AUTOMATION_SECRET;

/**
 * POST /api/admin/finance/automation
 * - Header Authorization: Bearer CRON_SECRET (for scheduled jobs), OR
 * - Session: ADMIN only (manual run)
 * Body: { run: "monthly" | "yearly" }
 */
export async function POST(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const bearer = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  const isCron = CRON_SECRET && bearer === CRON_SECRET;

  let actorUserId: string;
  let generatedByUserId: string;
  if (isCron) {
    const admin = await prisma.user.findFirst({ where: { role: "ADMIN" }, select: { id: true } });
    actorUserId = admin?.id ?? "system";
    generatedByUserId = admin?.id ?? "";
    if (!generatedByUserId) {
      return Response.json({ error: "No admin user to attribute automated document" }, { status: 500 });
    }
  } else {
    const actor = await getFinanceActor();
    if (!actor || !isFinancialStaff(actor.role)) {
      return Response.json({ error: "Unauthorized — financial role or cron secret required" }, { status: 401 });
    }
    actorUserId = actor.user.id;
    generatedByUserId = actor.user.id;
  }

  let body: { run?: string };
  try {
    body = await request.json();
  } catch {
    body = {};
  }
  const run = body.run === "yearly" ? "yearly" : "monthly";
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  const title =
    run === "monthly"
      ? `MONTHLY_PLATFORM_REPORT ${year}-${String(month).padStart(2, "0")}`
      : `PLATFORM_REVENUE_SUMMARY ${year}`;

  const start =
    run === "monthly" ? new Date(year, month - 1, 1) : new Date(year, 0, 1);
  const end =
    run === "monthly"
      ? new Date(year, month, 0, 23, 59, 59, 999)
      : new Date(year, 11, 31, 23, 59, 59, 999);

  const agg = await prisma.platformPayment.aggregate({
    where: { status: "paid", createdAt: { gte: start, lte: end } },
    _sum: { amountCents: true },
  });
  const fees = await prisma.platformPayment.aggregate({
    where: { status: "paid", createdAt: { gte: start, lte: end } },
    _sum: { stripeFeeCents: true },
  });
  const platComm = await prisma.brokerCommission.aggregate({
    where: { createdAt: { gte: start, lte: end } },
    _sum: { platformAmountCents: true, brokerAmountCents: true },
  });

  let summaryMarkdown = `# ${title}\n\n_Automated run ${now.toISOString()}_\n\n`;
  summaryMarkdown += `| Metric | Amount (CAD) |\n|--------|-------------|\n`;
  summaryMarkdown += `| Gross payments | $${((agg._sum.amountCents ?? 0) / 100).toFixed(2)} |\n`;
  summaryMarkdown += `| Stripe fees | $${((fees._sum.stripeFeeCents ?? 0) / 100).toFixed(2)} |\n`;
  summaryMarkdown += `| Platform commission | $${((platComm._sum.platformAmountCents ?? 0) / 100).toFixed(2)} |\n`;
  summaryMarkdown += `| Broker payouts | $${((platComm._sum.brokerAmountCents ?? 0) / 100).toFixed(2)} |\n\n`;
  summaryMarkdown += `_Not tax advice. Validate with a CPA for Canada/Quebec._\n`;

  const issueDate = new Date();
  const doc = await prisma.taxDocument.create({
    data: {
      documentType: run === "monthly" ? "MONTHLY_PLATFORM_REPORT" : "PLATFORM_REVENUE_SUMMARY",
      title,
      periodYear: year,
      periodMonth: run === "monthly" ? month : null,
      generatedByUserId,
      summaryMarkdown,
      status: "active",
      issueDate,
    },
  });

  await logFinancialAction({
    actorUserId,
    action: "finance_automation_run",
    entityType: "TaxDocument",
    entityId: doc.id,
    metadata: { run },
  });

  const notify = process.env.ADMIN_ALERT_EMAIL ?? process.env.ACCOUNTANT_ALERT_EMAIL;
  if (notify) {
    await sendEmail({
      to: notify,
      type: "admin_alert_payment",
      subject: `[Finance] ${title} generated`,
      html: `<p>Report saved as TaxDocument ${doc.id}. <a href="${process.env.NEXT_PUBLIC_APP_URL ?? ""}/admin/finance/tax">Open tax documents</a></p>`,
    });
  }

  return Response.json({ ok: true, documentId: doc.id, run });
}
