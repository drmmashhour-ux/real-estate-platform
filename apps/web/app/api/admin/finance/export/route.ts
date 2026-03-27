import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getFinanceActor } from "@/lib/admin/finance-request";
import { logFinancialAction } from "@/lib/admin/financial-audit";

export const dynamic = "force-dynamic";

function csvEscape(s: string | number | null | undefined): string {
  const v = s == null ? "" : String(s);
  if (/[",\n]/.test(v)) return `"${v.replace(/"/g, '""')}"`;
  return v;
}

/** GET /api/admin/finance/export?format=csv|pdf|json&type=transactions|revenue|payouts|tax_register|commissions|admin_report|tax_invoices */
export async function GET(request: NextRequest) {
  const actor = await getFinanceActor();
  if (!actor) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const format = (searchParams.get("format") ?? "csv").toLowerCase();
  const type = (searchParams.get("type") ?? "transactions").toLowerCase();
  const dateFrom = searchParams.get("dateFrom") ? new Date(searchParams.get("dateFrom")!) : undefined;
  const dateTo = searchParams.get("dateTo") ? new Date(searchParams.get("dateTo")!) : undefined;
  if (dateTo) dateTo.setHours(23, 59, 59, 999);

  const where = {
    ...(dateFrom || dateTo
      ? {
          createdAt: {
            ...(dateFrom ? { gte: dateFrom } : {}),
            ...(dateTo ? { lte: dateTo } : {}),
          },
        }
      : {}),
  };

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
  await logFinancialAction({
    actorUserId: actor.user.id,
    action: format === "pdf" ? "finance_export_pdf" : "finance_export_csv",
    ipAddress: ip,
    metadata: { type, format },
  });

  if (type === "payouts") {
    const rows = await prisma.brokerPayout.findMany({
      orderBy: { createdAt: "desc" },
      take: 2000,
      include: {
        broker: { select: { email: true, name: true } },
        lines: { select: { commissionId: true } },
      },
    });
    if (format === "csv") {
      const header = [
        "id",
        "brokerEmail",
        "brokerName",
        "status",
        "payoutMethod",
        "totalAmountCents",
        "currency",
        "approvedAt",
        "paidAt",
        "lineCount",
        "createdAt",
      ].join(",");
      const lines = rows.map((r) =>
        [
          r.id,
          r.broker.email,
          r.broker.name ?? "",
          r.status,
          r.payoutMethod,
          r.totalAmountCents,
          r.currency,
          r.approvedAt?.toISOString() ?? "",
          r.paidAt?.toISOString() ?? "",
          r.lines.length,
          r.createdAt.toISOString(),
        ]
          .map(csvEscape)
          .join(",")
      );
      const body = [header, ...lines].join("\n");
      return new Response(body, {
        status: 200,
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="broker-payouts-${new Date().toISOString().slice(0, 10)}.csv"`,
        },
      });
    }
    if (format === "pdf") {
      const { jsPDF } = await import("jspdf");
      const doc = new jsPDF();
      doc.setFontSize(14);
      doc.text("Broker payouts (manual recording)", 14, 20);
      doc.setFontSize(9);
      let y = 30;
      for (const r of rows.slice(0, 60)) {
        if (y > 280) {
          doc.addPage();
          y = 20;
        }
        doc.text(
          `${r.createdAt.toISOString().slice(0, 10)} | ${r.broker.email} | ${(r.totalAmountCents / 100).toFixed(2)} ${r.currency} | ${r.status} | ${r.payoutMethod}`,
          14,
          y
        );
        y += 5;
      }
      if (rows.length > 60) doc.text(`… ${rows.length - 60} more (use CSV)`, 14, y);
      const buf = doc.output("arraybuffer");
      return new Response(buf, {
        status: 200,
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="payouts-${new Date().toISOString().slice(0, 10)}.pdf"`,
        },
      });
    }
    return Response.json({ error: "Unsupported format for payouts" }, { status: 400 });
  }

  if (type === "tax_register") {
    const docs = await prisma.taxDocument.findMany({
      orderBy: { createdAt: "desc" },
      take: 3000,
      include: {
        subjectUser: { select: { email: true } },
        generatedBy: { select: { email: true } },
      },
    });
    if (format !== "csv") {
      return Response.json({ error: "tax_register export supports CSV only" }, { status: 400 });
    }
    const header = [
      "id",
      "documentType",
      "title",
      "status",
      "periodYear",
      "periodMonth",
      "subjectUserEmail",
      "generatedByEmail",
      "issueDate",
      "createdAt",
    ].join(",");
    const lines = docs.map((d) =>
      [
        d.id,
        d.documentType,
        d.title,
        d.status,
        d.periodYear ?? "",
        d.periodMonth ?? "",
        d.subjectUser?.email ?? "",
        d.generatedBy.email,
        d.issueDate?.toISOString() ?? "",
        d.createdAt.toISOString(),
      ]
        .map(csvEscape)
        .join(",")
    );
    return new Response([header, ...lines].join("\n"), {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="tax-document-register-${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    });
  }

  if (type === "commissions") {
    const rows = await prisma.brokerCommission.findMany({
      orderBy: { createdAt: "desc" },
      take: 5000,
      include: {
        broker: { select: { email: true, name: true } },
        payment: {
          select: {
            id: true,
            paymentType: true,
            amountCents: true,
            listingId: true,
            bookingId: true,
            dealId: true,
            createdAt: true,
          },
        },
      },
    });
    if (format === "csv") {
      const header = [
        "commissionId",
        "brokerEmail",
        "status",
        "grossAmountCents",
        "brokerAmountCents",
        "platformAmountCents",
        "paidAt",
        "paymentId",
        "paymentType",
        "listingId",
        "bookingId",
        "dealId",
        "createdAt",
      ].join(",");
      const lines = rows.map((r) =>
        [
          r.id,
          r.broker?.email ?? "",
          r.status,
          r.grossAmountCents,
          r.brokerAmountCents,
          r.platformAmountCents,
          r.paidAt?.toISOString() ?? "",
          r.payment.id,
          r.payment.paymentType,
          r.payment.listingId ?? "",
          r.payment.bookingId ?? "",
          r.payment.dealId ?? "",
          r.createdAt.toISOString(),
        ]
          .map(csvEscape)
          .join(",")
      );
      return new Response([header, ...lines].join("\n"), {
        status: 200,
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="commissions-${new Date().toISOString().slice(0, 10)}.csv"`,
        },
      });
    }
    return Response.json({ error: "Commissions export: use format=csv" }, { status: 400 });
  }

  if (type === "transactions" || type === "revenue") {
    const rows = await prisma.platformPayment.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 5000,
      select: {
        id: true,
        userId: true,
        paymentType: true,
        amountCents: true,
        currency: true,
        status: true,
        stripeFeeCents: true,
        refundedAmountCents: true,
        listingId: true,
        bookingId: true,
        dealId: true,
        createdAt: true,
        updatedAt: true,
        user: { select: { email: true } },
      },
    });

    if (format === "csv") {
      const header = [
        "id",
        "userId",
        "email",
        "paymentType",
        "amountCents",
        "currency",
        "status",
        "stripeFeeCents",
        "refundedAmountCents",
        "listingId",
        "bookingId",
        "dealId",
        "createdAt",
        "updatedAt",
      ].join(",");
      const lines = rows.map((r) =>
        [
          r.id,
          r.userId,
          r.user.email,
          r.paymentType,
          r.amountCents,
          r.currency,
          r.status,
          r.stripeFeeCents ?? "",
          r.refundedAmountCents ?? "",
          r.listingId ?? "",
          r.bookingId ?? "",
          r.dealId ?? "",
          r.createdAt.toISOString(),
          r.updatedAt.toISOString(),
        ]
          .map(csvEscape)
          .join(",")
      );
      const body = [header, ...lines].join("\n");
      return new Response(body, {
        status: 200,
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="platform-payments-${new Date().toISOString().slice(0, 10)}.csv"`,
        },
      });
    }

    if (format === "pdf") {
      const { jsPDF } = await import("jspdf");
      const doc = new jsPDF();
      doc.setFontSize(14);
      doc.text("Platform payments export", 14, 20);
      doc.setFontSize(9);
      let y = 30;
      const lineH = 5;
      for (const r of rows.slice(0, 80)) {
        if (y > 280) {
          doc.addPage();
          y = 20;
        }
        doc.text(
          `${r.createdAt.toISOString().slice(0, 10)} | ${r.paymentType} | ${(r.amountCents / 100).toFixed(2)} ${r.currency} | ${r.status} | ${r.user.email}`,
          14,
          y
        );
        y += lineH;
      }
      if (rows.length > 80) {
        doc.text(`… and ${rows.length - 80} more rows (use CSV for full export)`, 14, y);
      }
      const buf = doc.output("arraybuffer");
      return new Response(buf, {
        status: 200,
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="payments-${new Date().toISOString().slice(0, 10)}.pdf"`,
        },
      });
    }
  }

  if (type === "admin_report") {
    const period = (searchParams.get("period") ?? "monthly").toLowerCase();
    const { generateDailyReport, generateWeeklyReport, generateMonthlyReport, generateYearlyReport } = await import(
      "@/modules/ai/admin-reports"
    );
    const fn =
      period === "daily"
        ? generateDailyReport
        : period === "weekly"
          ? generateWeeklyReport
          : period === "yearly"
            ? generateYearlyReport
            : generateMonthlyReport;
    const report = await fn();
    if (format === "json") {
      return Response.json(report);
    }
    if (format === "csv") {
      const rows: string[][] = [];
      rows.push(["field", "value"]);
      rows.push(["period", report.period]);
      rows.push(["generatedAt", report.generatedAt]);
      rows.push(["headline", report.headline]);
      report.bullets.forEach((b, i) => rows.push([`bullet_${i}`, b]));
      if (report.kpis) report.kpis.forEach((k) => rows.push([k.label, k.value]));
      if (report.financeInsights) report.financeInsights.forEach((x, i) => rows.push([`insight_${i}`, x]));
      const body = rows.map((r) => r.map(csvEscape).join(",")).join("\n");
      return new Response(body, {
        status: 200,
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="admin-report-${report.period}-${new Date().toISOString().slice(0, 10)}.csv"`,
        },
      });
    }
  }

  if (type === "tax_invoices") {
    const rows = await prisma.platformInvoice.findMany({
      orderBy: { createdAt: "desc" },
      take: 8000,
      include: {
        payment: {
          select: {
            paymentType: true,
            status: true,
            bookingId: true,
            dealId: true,
            fsboListingId: true,
            user: { select: { email: true } },
          },
        },
      },
    });
    if (format !== "csv") {
      return Response.json({ error: "tax_invoices supports CSV only" }, { status: 400 });
    }
    const header = [
      "invoiceId",
      "invoiceNumber",
      "issuedAt",
      "userEmail",
      "subtotalCents",
      "gstCents",
      "qstCents",
      "totalCents",
      "amountCents",
      "paymentType",
      "paymentStatus",
      "bookingId",
      "dealId",
      "fsboListingId",
    ].join(",");
    const lines = rows.map((r) =>
      [
        r.id,
        r.invoiceNumber,
        r.issuedAt.toISOString(),
        r.payment?.user?.email ?? "",
        r.subtotalCents ?? "",
        r.gstCents ?? "",
        r.qstCents ?? "",
        r.totalCents ?? "",
        r.amountCents,
        r.payment?.paymentType ?? "",
        r.payment?.status ?? "",
        r.payment?.bookingId ?? "",
        r.payment?.dealId ?? "",
        r.payment?.fsboListingId ?? "",
      ]
        .map(csvEscape)
        .join(",")
    );
    return new Response([header, ...lines].join("\n"), {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="platform-invoices-tax-${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    });
  }

  return Response.json({ error: "Unsupported format or type" }, { status: 400 });
}
