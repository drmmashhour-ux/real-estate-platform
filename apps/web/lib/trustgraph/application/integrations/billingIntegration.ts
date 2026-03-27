import { recordUsage } from "@/lib/trustgraph/infrastructure/services/usageTrackingService";

export async function trackDocumentExtractionUsage(args: { workspaceId: string | null }) {
  return recordUsage({ workspaceId: args.workspaceId, usageType: "document_extraction", quantity: 1 });
}

export async function trackExternalApiUsage(args: { workspaceId: string | null }) {
  return recordUsage({ workspaceId: args.workspaceId, usageType: "external_api_call", quantity: 1 });
}

export { recordUsage };
