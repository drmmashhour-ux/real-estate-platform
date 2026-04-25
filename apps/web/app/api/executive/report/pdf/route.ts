import { NextRequest, NextResponse } from "next/server";
import { PlatformRole } from "@prisma/client";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import type { ExecutiveReportView } from "@/modules/executive-reporting/executive-report.types";
import {
  generateExecutiveReportPdf,
  readExecutivePdfFile,
  safeUnlinkExecutivePdf,
} from "@/modules/executive-reporting/pdf-export.service";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const userId = await getGuestId();
    if (!userId) return NextResponse.json({ ok: false, error: "Sign in required" }, { status: 401 });
    const u = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
    if (!u || u.role !== PlatformRole.ADMIN) {
      return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
    }

    const id = new URL(req.url).searchParams.get("id")?.trim();
    if (!id) return NextResponse.json({ ok: false, error: "id_required" }, { status: 400 });

    const row = await prisma.executiveReport.findUnique({ where: { id } });
    if (!row || row.status === "FAILED") {
      return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
    }

    const view = row.reportJson as unknown as ExecutiveReportView;
    const pdf = generateExecutiveReportPdf(view);
    if (!pdf.ok) {
      return NextResponse.json({ ok: false, error: pdf.error }, { status: 200 });
    }

    const buf = readExecutivePdfFile(pdf.pdfPath);
    safeUnlinkExecutivePdf(pdf.pdfPath);

    return new NextResponse(buf, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="executive-report-${view.periodKey}.pdf"`,
      },
    });
  } catch {
    return NextResponse.json({ ok: false, error: "unavailable" }, { status: 200 });
  }
}
