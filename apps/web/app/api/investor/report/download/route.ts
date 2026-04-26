import { existsSync } from "fs";
import { readFileSync } from "fs";
import { NextResponse } from "next/server";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();
import { requireBnhubInvestorPortalAccessApi } from "@/modules/investor/auth/require-bnhub-investor-portal-api";

export const dynamic = "force-dynamic";

/** Download a stored BNHub investor PDF by opaque log id — **scope-checked** against the signed-in investor. */
export async function GET(req: Request) {
  const gate = await requireBnhubInvestorPortalAccessApi();
  if (!gate.ok) return gate.response;

  const id = new URL(req.url).searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  const report = await prisma.reportDeliveryLog.findUnique({
    where: { id },
  });

  if (!report || report.status !== "success" || !report.pdfPath) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (report.scopeType !== gate.investor.scopeType || report.scopeId !== gate.investor.scopeId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (!existsSync(report.pdfPath)) {
    return NextResponse.json({ error: "File no longer available" }, { status: 410 });
  }

  try {
    const buffer = readFileSync(report.pdfPath);
    return new Response(buffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'attachment; filename="BNHub_Report.pdf"',
        "Cache-Control": "no-store",
      },
    });
  } catch {
    return NextResponse.json({ error: "Read failed" }, { status: 500 });
  }
}
