import { NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import {
  generateBnhubInvestorReportPdf,
  readPdfFile,
  safeUnlink,
} from "@/modules/revenue/report/pdf-report.service";
import { buildBnhubInvestorReportPayload } from "@/modules/revenue/report/bnhub-investor-report-payload";

/** Shared GET handler for BNHub investor PDF — session-scoped host only (no `userId` query; avoids impersonation). */
export async function handleInvestorReportGet(): Promise<Response> {
  const userId = await getGuestId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const built = await buildBnhubInvestorReportPayload(userId);
  if (!built.ok) {
    return NextResponse.json(
      {
        error: built.error,
        ...(built.detail ? { detail: built.detail } : {}),
      },
      { status: 503 }
    );
  }

  let pdfPath: string | null = null;
  try {
    pdfPath = await generateBnhubInvestorReportPdf(built.payload);
    const buf = readPdfFile(pdfPath);
    return new Response(buf, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'attachment; filename="BNHub_Report.pdf"',
        "Cache-Control": "no-store",
      },
    });
  } catch (e) {
    const detail = e instanceof Error ? e.message : String(e);
    return NextResponse.json(
      {
        error: "PDF generation unavailable",
        detail,
      },
      { status: 503 }
    );
  } finally {
    if (pdfPath) safeUnlink(pdfPath);
  }
}
