import { NextRequest } from "next/server";
import { prisma } from "@repo/db";
import { getFinanceActor } from "@/lib/admin/finance-request";
import { logFinancialAction } from "@/lib/admin/financial-audit";
import { TAX_DISCLAIMER } from "@/lib/tax/quebec-broker-tax";

export const dynamic = "force-dynamic";

/** GET /api/admin/finance/tax — list generated tax documents */
export async function GET(request: NextRequest) {
  const actor = await getFinanceActor();
  if (!actor) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const subjectUserId = searchParams.get("userId")?.trim() || undefined;
  const year = searchParams.get("year") ? parseInt(searchParams.get("year")!, 10) : undefined;
  const docStatus = searchParams.get("status")?.trim() || undefined;
  const documentType = searchParams.get("documentType")?.trim() || undefined;
  const q = searchParams.get("q")?.trim() || undefined;

  const docs = await prisma.taxDocument.findMany({
    where: {
      ...(subjectUserId ? { subjectUserId } : {}),
      ...(year != null && !Number.isNaN(year) ? { periodYear: year } : {}),
      ...(docStatus ? { status: docStatus } : {}),
      ...(documentType ? { documentType } : {}),
      ...(q
        ? {
            OR: [
              { title: { contains: q, mode: "insensitive" as const } },
              { documentType: { contains: q, mode: "insensitive" as const } },
            ],
          }
        : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      subjectUser: { select: { email: true, name: true } },
      generatedBy: { select: { email: true } },
    },
  });

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
  await logFinancialAction({
    actorUserId: actor.user.id,
    action: "finance_tax_list",
    ipAddress: ip,
  });

  return Response.json({ data: docs });
}

type GenerateBody = {
  documentType: string;
  title?: string;
  periodYear?: number;
  periodMonth?: number;
  subjectUserId?: string | null;
  dealId?: string | null;
  platformPaymentId?: string | null;
};

/** POST /api/admin/finance/tax — generate tax summary / slip record (data for export) */
export async function POST(request: NextRequest) {
  const actor = await getFinanceActor();
  if (!actor) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: GenerateBody;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const allowedTypes = [
    "TAX_SUMMARY",
    "ANNUAL_EARNINGS_SLIP",
    "ANNUAL_EARNINGS_SUMMARY",
    "BROKER_COMMISSION_SLIP",
    "BROKER_COMMISSION_SUMMARY",
    "BROKER_PAYOUT_SUMMARY",
    "PLATFORM_REVENUE_SUMMARY",
    "COMMISSION_REPORT",
    "RECEIPT",
    "INVOICE",
    "MONTHLY_PLATFORM_REPORT",
  ];
  if (!body.documentType || !allowedTypes.includes(body.documentType)) {
    return Response.json({ error: "Invalid documentType" }, { status: 400 });
  }

  if (body.documentType === "BROKER_PAYOUT_SUMMARY" && !body.subjectUserId?.trim()) {
    return Response.json({ error: "subjectUserId (broker) required for BROKER_PAYOUT_SUMMARY" }, { status: 400 });
  }

  const year = body.periodYear ?? new Date().getFullYear();
  const month = body.periodMonth ?? null;

  const displayTitle =
    body.documentType === "ANNUAL_EARNINGS_SLIP" || body.documentType === "ANNUAL_EARNINGS_SUMMARY"
      ? `Annual Earnings Summary (internal) — ${year}`
      : body.documentType === "BROKER_COMMISSION_SLIP" || body.documentType === "BROKER_COMMISSION_SUMMARY"
        ? `Commission Summary (internal) — ${year}`
        : body.documentType.replace(/_/g, " ");

  let summaryMarkdown = `# ${displayTitle}\n\n`;
  summaryMarkdown += `Tax year / period: ${year}${month != null ? ` · Month ${String(month).padStart(2, "0")}` : ""}\n\n`;
  summaryMarkdown += `_Generated ${new Date().toISOString()}. **Not an official government tax form.** Internal accounting extract only. A licensed accountant must validate compliance (e.g. GST/QST in Quebec)._\n\n`;

  const userAnnualTypes = new Set([
    "ANNUAL_EARNINGS_SLIP",
    "ANNUAL_EARNINGS_SUMMARY",
    "BROKER_COMMISSION_SLIP",
    "BROKER_COMMISSION_SUMMARY",
  ]);

  if (body.subjectUserId && userAnnualTypes.has(body.documentType)) {
    const yStart = new Date(year, 0, 1);
    const yEnd = new Date(year + 1, 0, 1);
    const [payments, brokerCommissions] = await Promise.all([
      prisma.platformPayment.findMany({
        where: { userId: body.subjectUserId, status: "paid", createdAt: { gte: yStart, lt: yEnd } },
        select: {
          paymentType: true,
          amountCents: true,
          createdAt: true,
          id: true,
          stripeFeeCents: true,
          refundedAmountCents: true,
        },
      }),
      prisma.brokerCommission.findMany({
        where: { brokerId: body.subjectUserId, createdAt: { gte: yStart, lt: yEnd } },
        select: { grossAmountCents: true, brokerAmountCents: true, platformAmountCents: true, createdAt: true },
      }),
    ]);
    const payGross = payments.reduce((s, p) => s + p.amountCents, 0);
    const refunds = payments.reduce((s, p) => s + (p.refundedAmountCents ?? 0), 0);
    const fees = payments.reduce((s, p) => s + (p.stripeFeeCents ?? 0), 0);
    const commGross = brokerCommissions.reduce((s, c) => s + c.grossAmountCents, 0);
    const commBroker = brokerCommissions.reduce((s, c) => s + c.brokerAmountCents, 0);
    summaryMarkdown += `## Totals for subject user (${year})\n`;
    summaryMarkdown += `- Payment records (paid): ${payments.length}\n`;
    summaryMarkdown += `- Gross platform payments: $${(payGross / 100).toFixed(2)}\n`;
    summaryMarkdown += `- Refunds recorded: $${(refunds / 100).toFixed(2)}\n`;
    summaryMarkdown += `- Stripe fees (recorded on payments): $${(fees / 100).toFixed(2)}\n`;
    summaryMarkdown += `- Commission rows: ${brokerCommissions.length}\n`;
    summaryMarkdown += `- Gross via commission rows: $${(commGross / 100).toFixed(2)}\n`;
    summaryMarkdown += `- Broker share (commission rows): $${(commBroker / 100).toFixed(2)}\n`;
  }

  if (body.documentType === "BROKER_PAYOUT_SUMMARY" && body.subjectUserId) {
    const yStart = new Date(year, 0, 1);
    const yEnd = new Date(year + 1, 0, 1);
    const payouts = await prisma.brokerPayout.findMany({
      where: {
        brokerId: body.subjectUserId,
        status: "PAID",
        paidAt: { gte: yStart, lt: yEnd },
      },
      select: { id: true, totalAmountCents: true, paidAt: true, payoutMethod: true },
    });
    const total = payouts.reduce((s, p) => s + p.totalAmountCents, 0);
    summaryMarkdown += `## Broker payout summary (internal) — manual recordings\n`;
    summaryMarkdown += `- Paid batches: ${payouts.length}\n`;
    summaryMarkdown += `- Total marked paid: $${(total / 100).toFixed(2)}\n`;
    for (const p of payouts.slice(0, 20)) {
      summaryMarkdown += `- ${p.paidAt?.toISOString().slice(0, 10) ?? "?"} · ${(p.totalAmountCents / 100).toFixed(2)} · ${p.payoutMethod} · ${p.id.slice(0, 8)}…\n`;
    }
    if (payouts.length > 20) summaryMarkdown += `- … ${payouts.length - 20} more\n`;
  }

  if (body.subjectUserId?.trim()) {
    const reg = await prisma.brokerTaxRegistration.findUnique({
      where: { userId: body.subjectUserId.trim() },
    });
    if (reg) {
      summaryMarkdown += `## Tax registration on file (broker-provided; format-checked only)\n`;
      summaryMarkdown += `- Legal name: ${reg.legalName}\n`;
      if (reg.businessName) summaryMarkdown += `- Business name: ${reg.businessName}\n`;
      summaryMarkdown += `- Business number (9 digits): ${reg.businessNumberNine}\n`;
      if (reg.gstNumber) summaryMarkdown += `- GST registration no. (as provided): ${reg.gstNumber}\n`;
      if (reg.qstNumber) summaryMarkdown += `- QST registration no. (as provided): ${reg.qstNumber}\n`;
      summaryMarkdown += `- Address: ${reg.businessAddress.replace(/\n/g, " ")}\n`;
      summaryMarkdown += `- Province: ${reg.province}\n`;
      summaryMarkdown += `- Internal review status: ${reg.status} (not a government verification)\n`;
      summaryMarkdown += `\n_${TAX_DISCLAIMER}_\n\n`;
    }
  }

  if (body.documentType === "PLATFORM_REVENUE_SUMMARY" || body.documentType === "MONTHLY_PLATFORM_REPORT") {
    const start = month != null ? new Date(year, month - 1, 1) : new Date(year, 0, 1);
    const end = month != null ? new Date(year, month, 0, 23, 59, 59, 999) : new Date(year, 11, 31, 23, 59, 59, 999);
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
    summaryMarkdown += `## Platform summary\n`;
    summaryMarkdown += `- Gross payments: $${((agg._sum.amountCents ?? 0) / 100).toFixed(2)}\n`;
    summaryMarkdown += `- Stripe fees (recorded): $${((fees._sum.stripeFeeCents ?? 0) / 100).toFixed(2)}\n`;
    summaryMarkdown += `- Platform commission share: $${((platComm._sum.platformAmountCents ?? 0) / 100).toFixed(2)}\n`;
    summaryMarkdown += `- Broker share: $${((platComm._sum.brokerAmountCents ?? 0) / 100).toFixed(2)}\n`;
    const platNote = process.env.PLATFORM_TAX_REGISTRATION_NOTE?.trim();
    if (platNote) {
      summaryMarkdown += `\n## Platform tax registration note (configured)\n${platNote}\n`;
    }
  }

  const issueDate = new Date();
  const doc = await prisma.taxDocument.create({
    data: {
      documentType: body.documentType,
      title: body.title ?? displayTitle,
      periodYear: year,
      periodMonth: month,
      subjectUserId: body.subjectUserId ?? null,
      dealId: body.dealId ?? null,
      platformPaymentId: body.platformPaymentId ?? null,
      summaryMarkdown,
      generatedByUserId: actor.user.id,
      status: "active",
      issueDate,
    },
  });

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
  await logFinancialAction({
    actorUserId: actor.user.id,
    action: "tax_doc_generate",
    entityType: "TaxDocument",
    entityId: doc.id,
    ipAddress: ip,
    metadata: { documentType: body.documentType },
  });

  return Response.json({ ok: true, document: doc });
}
