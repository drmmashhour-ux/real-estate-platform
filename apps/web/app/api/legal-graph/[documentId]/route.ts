import { NextResponse } from "next/server";
import { requireLegalGraphDocumentAccess } from "@/app/api/legal-graph/_auth";
import { buildLegalGraph } from "@/src/modules/legal-intelligence-graph/application/buildLegalGraph";
import { getLegalGraphSummary } from "@/src/modules/legal-intelligence-graph/application/getLegalGraphSummary";
import { getDocumentAndProperty } from "@/src/modules/legal-intelligence-graph/infrastructure/legalGraphRepository";
import { explainLegalGraphSummary } from "@/src/modules/legal-intelligence-graph/explanation/legalGraphExplanationService";

export async function GET(_req: Request, context: { params: Promise<{ documentId: string }> }) {
  const { documentId } = await context.params;
  const auth = await requireLegalGraphDocumentAccess(documentId);
  if (!auth.ok) return NextResponse.json({ error: "forbidden" }, { status: auth.status });

  const built = await buildLegalGraph({ documentId, actorUserId: auth.userId! });
  const summary = await getLegalGraphSummary(built.propertyId);
  const explanation = explainLegalGraphSummary(summary);
  const doc = await getDocumentAndProperty(documentId);
  return NextResponse.json({ documentId, propertyId: built.propertyId, status: doc?.status ?? null, summary, explanation });
}
