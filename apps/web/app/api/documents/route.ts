import { NextRequest, NextResponse } from "next/server";
import { requireAuthUser, requireBrokerOrAdmin } from "@/lib/deals/guard-pipeline-deal";
import { legalDocumentsEngineEnabled, listLegalDocumentArtifacts } from "@/modules/legal-documents";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  if (!legalDocumentsEngineEnabled()) {
    return NextResponse.json({ error: "Legal documents engine disabled" }, { status: 503 });
  }
  const auth = await requireAuthUser();
  if (!auth.ok) return auth.response;
  if (!requireBrokerOrAdmin(auth.role)) {
    return NextResponse.json({ error: "Broker or administrator access required" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const domain = searchParams.get("domain") as "BROKERAGE" | "INVESTMENT" | "INTERNAL_HANDOFF" | null;
  const group = searchParams.get("group") as "awaiting" | "signed_archived" | "all" | null;

  const rows = await listLegalDocumentArtifacts({
    userId: auth.userId,
    role: auth.role,
    domain: domain ?? undefined,
    statusGroup: group === "awaiting" || group === "signed_archived" ? group : group === "all" ? "all" : undefined,
  });

  return NextResponse.json({
    items: rows.map((a) => ({
      id: a.id,
      kind: a.kind,
      domain: a.domain,
      status: a.status,
      dealId: a.dealId,
      capitalDealId: a.capitalDealId,
      templateKind: a.templateVersion.template.kind,
      approvedAt: a.approvedAt?.toISOString() ?? null,
      createdAt: a.createdAt.toISOString(),
    })),
  });
}
