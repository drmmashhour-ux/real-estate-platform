import { buildLegalGraph } from "@/src/modules/legal-intelligence-graph/application/buildLegalGraph";
import { getLegalGraphSummary } from "@/src/modules/legal-intelligence-graph/application/getLegalGraphSummary";

export async function getCaseLegalSummary(documentId: string, actorUserId?: string) {
  const built = await buildLegalGraph({ documentId, actorUserId });
  const summary = await getLegalGraphSummary(built.propertyId);
  return { propertyId: built.propertyId, summary };
}
