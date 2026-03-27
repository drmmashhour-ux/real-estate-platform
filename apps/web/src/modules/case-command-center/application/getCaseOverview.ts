import { getCaseCRMData } from "@/src/modules/case-command-center/application/getCaseCRMData";
import { getCaseDocumentsStatus } from "@/src/modules/case-command-center/application/getCaseDocumentsStatus";
import { getCaseHealthSnapshot } from "@/src/modules/case-command-center/application/getCaseHealthSnapshot";
import { getCaseUnifiedTimeline } from "@/src/modules/case-command-center/application/getCaseUnifiedTimeline";

export async function getCaseOverview(documentId: string, actorUserId?: string) {
  const [snapshot, crm, timeline, docs] = await Promise.all([
    getCaseHealthSnapshot(documentId, actorUserId),
    getCaseCRMData(documentId),
    getCaseUnifiedTimeline(documentId),
    getCaseDocumentsStatus(documentId),
  ]);

  if (!snapshot || !docs) return null;

  const aiRecommendations = [
    { priority: "high" as const, action: snapshot.primaryNextAction },
    ...snapshot.secondaryActions.map((a) => ({ priority: "medium" as const, action: a })),
  ].slice(0, 4);

  return {
    documentId,
    propertyId: snapshot.propertyId,
    healthSnapshot: snapshot,
    legalSummary: snapshot.legalSummary,
    legalHealthScore: snapshot.score,
    knowledgeRules: snapshot.knowledgeRules,
    documents: docs,
    crm,
    timeline,
    aiRecommendations,
  };
}
