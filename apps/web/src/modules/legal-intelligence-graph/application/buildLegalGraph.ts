import { buildLegalGraphForDocument } from "@/src/modules/legal-intelligence-graph/infrastructure/legalGraphBuilderService";

export async function buildLegalGraph(args: { documentId?: string; propertyId?: string; actorUserId?: string }) {
  if (args.documentId) return buildLegalGraphForDocument(args.documentId, args.actorUserId);
  throw new Error("documentId is required for current implementation");
}
