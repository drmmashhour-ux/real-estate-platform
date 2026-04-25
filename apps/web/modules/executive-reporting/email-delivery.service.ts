import { prisma } from "@/lib/db";
import { sendEmailWithAttachments } from "@/lib/email/resend-attachments";
import type { ExecutiveReportView } from "./executive-report.types";
import { logExecutiveReportSent } from "./executive-report.logging";
import { generateExecutiveReportPdf, readExecutivePdfFile, safeUnlinkExecutivePdf } from "./pdf-export.service";

export type SendExecutiveReportResult =
  | { ok: true; recipients: number }
  | { ok: false; error: string };

function parseRecipients(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter((x): x is string => typeof x === "string" && x.includes("@"));
}

/**
 * Sends report by id: loads JSON, builds PDF, emails recipients. Does not throw.
 */
export async function sendExecutiveReport(
  reportId: string,
  recipients: string[]
): Promise<SendExecutiveReportResult> {
  try {
    const row = await prisma.executiveReport.findUnique({ where: { id: reportId } });
    if (!row || row.status === ExecutiveReportStatus.FAILED) {
      return { ok: false, error: "report_not_found_or_failed" };
    }

    const view = row.reportJson as unknown as ExecutiveReportView;
    if (!view?.periodKey || !view?.narrative?.summaryText) {
      return { ok: false, error: "report_json_invalid" };
    }

    const pdf = generateExecutiveReportPdf(view);
    if (!pdf.ok) {
      await prisma.executiveReport.update({
        where: { id: reportId },
        data: { errorMessage: `pdf: ${pdf.error}` },
      });
      return { ok: false, error: pdf.error };
    }

    const buf = readExecutivePdfFile(pdf.pdfPath);
    safeUnlinkExecutivePdf(pdf.pdfPath);

    const emails = [...new Set(parseRecipients(recipients))];
    if (emails.length === 0) {
      return { ok: false, error: "no_recipients" };
    }

    const subject = `Executive report ${view.periodKey}`;
    const html = `
      <p>Executive data pack for <strong>${escapeHtml(view.periodKey)}</strong>.</p>
      <p>${escapeHtml(view.narrative.summaryText)}</p>
      <p>PDF attached. Metrics trace to tables noted in the report JSON.</p>
    `;

    let sent = 0;
    let failed = 0;
    for (const to of emails) {
      const ok = await sendEmailWithAttachments({
        to,
        subject,
        html,
        attachments: [{ filename: `executive-report-${view.periodKey}.pdf`, content: buf }],
      });
      if (ok) sent += 1;
      else failed += 1;
    }

    if (sent === 0) {
      return { ok: false, error: "email_send_failed" };
    }

    if (failed === 0) {
      await prisma.executiveReport.update({
        where: { id: reportId },
        data: { status: "SENT" },
      });
    } else {
      await prisma.executiveReport.update({
        where: { id: reportId },
        data: { errorMessage: `partial_email: ${sent} ok, ${failed} failed` },
      });
    }

    logExecutiveReportSent({ reportId, recipients: sent, failed, periodKey: view.periodKey });
    return { ok: true, recipients: sent };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "send_failed";
    try {
      await prisma.executiveReport.update({
        where: { id: reportId },
        data: { errorMessage: msg },
      });
    } catch {
      /* ignore */
    }
    return { ok: false, error: msg };
  }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
