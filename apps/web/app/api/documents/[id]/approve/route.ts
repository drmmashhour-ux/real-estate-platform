import { NextResponse } from "next/server";
import { requireAuthUser, requireBrokerOrAdmin } from "@/lib/deals/guard-pipeline-deal";
import { approveLegalDocumentArtifact, legalDocumentsEngineEnabled } from "@/modules/legal-documents";

export const dynamic = "force-dynamic";

export async function POST(req: Request, context: { params: Promise<{ id: string }> }) {
  if (!legalDocumentsEngineEnabled()) {
    return NextResponse.json({ error: "Legal documents engine disabled" }, { status: 503 });
  }
  const auth = await requireAuthUser();
  if (!auth.ok) return auth.response;
  if (!requireBrokerOrAdmin(auth.role)) {
    return NextResponse.json({ error: "Broker or administrator access required" }, { status: 403 });
  }

  const { id } = await context.params;
  const body = (await req.json().catch(() => ({}))) as { brokerConfirmed?: boolean };
  if (!body.brokerConfirmed) {
    return NextResponse.json({ error: "brokerConfirmed must be true" }, { status: 400 });
  }

  try {
    await approveLegalDocumentArtifact({
      artifactId: id,
      userId: auth.userId,
      role: auth.role,
      brokerConfirmed: true,
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Approve failed" }, { status: 400 });
  }
}
