import { NextResponse } from "next/server";
import { requireAuthUser } from "@/lib/deals/guard-pipeline-deal";
import { legalDocumentsEngineEnabled, recordInvestmentLegalComplianceApproval } from "@/modules/legal-documents";

export const dynamic = "force-dynamic";

export async function POST(req: Request, context: { params: Promise<{ id: string }> }) {
  if (!legalDocumentsEngineEnabled()) {
    return NextResponse.json({ error: "Legal documents engine disabled" }, { status: 503 });
  }
  const auth = await requireAuthUser();
  if (!auth.ok) return auth.response;

  const { id } = await context.params;
  const body = (await req.json().catch(() => ({}))) as { confirmed?: boolean };
  if (!body.confirmed) {
    return NextResponse.json({ error: "confirmed must be true" }, { status: 400 });
  }

  try {
    await recordInvestmentLegalComplianceApproval({
      artifactId: id,
      userId: auth.userId,
      role: auth.role,
      confirmed: true,
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Compliance approval failed" }, { status: 400 });
  }
}
