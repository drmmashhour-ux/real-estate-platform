import { NextResponse } from "next/server";
import { requireAuthUser, requireBrokerOrAdmin } from "@/lib/deals/guard-pipeline-deal";
import { legalDocumentsEngineEnabled } from "@/modules/legal-documents";
import { getLockedPdfBytes } from "@/modules/digital-signature";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, context: { params: Promise<{ id: string }> }) {
  if (!legalDocumentsEngineEnabled()) {
    return NextResponse.json({ error: "Legal documents engine disabled" }, { status: 503 });
  }
  const auth = await requireAuthUser();
  if (!auth.ok) return auth.response;

  const { id } = await context.params;
  const buf = await getLockedPdfBytes({ artifactId: id, userId: auth.userId, role: auth.role });
  if (!buf) {
    return NextResponse.json({ error: "PDF not available — sign the document first." }, { status: 404 });
  }

  return new NextResponse(new Uint8Array(buf), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="lecipm-signed-${id.slice(0, 8)}.pdf"`,
    },
  });
}
