import { NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { getLegalGraphSummary } from "@/src/modules/legal-intelligence-graph/application/getLegalGraphSummary";
import { explainLegalGraphSummary } from "@/src/modules/legal-intelligence-graph/explanation/legalGraphExplanationService";

export async function GET(_req: Request, context: { params: Promise<{ propertyId: string }> }) {
  const userId = await getGuestId();
  if (!userId) return NextResponse.json({ error: "sign in required" }, { status: 401 });
  const { propertyId } = await context.params;
  const summary = await getLegalGraphSummary(propertyId);
  const explanation = explainLegalGraphSummary(summary);
  return NextResponse.json({ propertyId, summary, explanation });
}
