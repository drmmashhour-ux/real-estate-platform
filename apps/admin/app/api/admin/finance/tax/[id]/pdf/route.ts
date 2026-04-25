import { NextRequest } from "next/server";
import { prisma } from "@repo/db";
import { getFinanceActor } from "@/lib/admin/finance-request";
import { logFinancialAction } from "@/lib/admin/financial-audit";

export const dynamic = "force-dynamic";

/** GET /api/admin/finance/tax/[id]/pdf — PDF for a tax document */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const actor = await getFinanceActor();
  if (!actor) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const doc = await prisma.taxDocument.findUnique({ where: { id } });
  if (!doc) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  const { jsPDF } = await import("jspdf");
  const pdf = new jsPDF();
  pdf.setFontSize(9);
  pdf.setTextColor(120, 120, 120);
  pdf.text("Internal accounting document — not an official government tax form.", 14, 14);
  pdf.setTextColor(0, 0, 0);
  pdf.setFontSize(14);
  pdf.text(doc.title, 14, 24);
  pdf.setFontSize(10);
  const lines = pdf.splitTextToSize(doc.summaryMarkdown ?? "", 180);
  pdf.text(lines, 14, 34);

  await logFinancialAction({
    actorUserId: actor.user.id,
    action: "tax_doc_pdf_download",
    entityType: "TaxDocument",
    entityId: id,
    ipAddress: request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null,
  });

  const buf = pdf.output("arraybuffer");
  return new Response(buf, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="tax-doc-${id.slice(0, 8)}.pdf"`,
    },
  });
}
