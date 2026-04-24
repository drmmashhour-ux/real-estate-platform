import { NextResponse } from "next/server";
import { requireAuthUser } from "@/lib/deals/guard-pipeline-deal";
import { legalDocumentsEngineEnabled } from "@/modules/legal-documents";
import { exportSignatureAuditJson } from "@/modules/digital-signature";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, context: { params: Promise<{ id: string }> }) {
  if (!legalDocumentsEngineEnabled()) {
    return NextResponse.json({ error: "Legal documents engine disabled" }, { status: 503 });
  }
  const auth = await requireAuthUser();
  if (!auth.ok) return auth.response;

  const { id } = await context.params;
  const report = await exportSignatureAuditJson({ artifactId: id, userId: auth.userId, role: auth.role });
  if (!report) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json(report);
}
