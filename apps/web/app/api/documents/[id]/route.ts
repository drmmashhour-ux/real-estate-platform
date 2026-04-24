import { NextResponse } from "next/server";
import { requireAuthUser, requireBrokerOrAdmin } from "@/lib/deals/guard-pipeline-deal";
import { getLegalDocumentArtifact, legalDocumentsEngineEnabled } from "@/modules/legal-documents";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, context: { params: Promise<{ id: string }> }) {
  if (!legalDocumentsEngineEnabled()) {
    return NextResponse.json({ error: "Legal documents engine disabled" }, { status: 503 });
  }
  const auth = await requireAuthUser();
  if (!auth.ok) return auth.response;
  if (!requireBrokerOrAdmin(auth.role)) {
    return NextResponse.json({ error: "Broker or administrator access required" }, { status: 403 });
  }

  const { id } = await context.params;
  const row = await getLegalDocumentArtifact({ artifactId: id, userId: auth.userId, role: auth.role });
  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({
    id: row.id,
    kind: row.kind,
    domain: row.domain,
    status: row.status,
    dealId: row.dealId,
    capitalDealId: row.capitalDealId,
    sourceDataSnapshot: row.sourceDataSnapshot,
    renderedHtml: row.renderedHtml,
    approvedByBrokerId: row.approvedByBrokerId,
    approvedAt: row.approvedAt?.toISOString() ?? null,
    investmentComplianceApprovedAt: row.investmentComplianceApprovedAt?.toISOString() ?? null,
    signatureSessionId: row.signatureSessionId,
    template: {
      kind: row.templateVersion.template.kind,
      name: row.templateVersion.template.name,
      versionNumber: row.templateVersion.versionNumber,
    },
    dispatches: row.dispatches,
    disclaimer:
      "Assistive document only — not legal, tax, or securities advice. Official OACIQ/AMF instruments prevail.",
  });
}
