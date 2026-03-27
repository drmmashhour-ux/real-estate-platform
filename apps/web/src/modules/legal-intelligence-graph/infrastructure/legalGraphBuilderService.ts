import { runDeclarationValidationDeterministic } from "@/src/modules/seller-declaration-ai/validation/declarationValidationService";
import { captureServerEvent } from "@/lib/analytics/posthog-server";
import { clearGraphForProperty, createGraphEdge, createGraphIssue, createGraphNode, getDocumentAndProperty } from "@/src/modules/legal-intelligence-graph/infrastructure/legalGraphRepository";
import { detectContradictions } from "@/src/modules/legal-intelligence-graph/rules/contradictionDetectionService";
import { detectMissingDependencies } from "@/src/modules/legal-intelligence-graph/rules/dependencyRuleService";
import { detectReviewBlockers } from "@/src/modules/legal-intelligence-graph/rules/reviewBlockerService";
import { detectSignatureBlockers } from "@/src/modules/legal-intelligence-graph/rules/signatureBlockerService";
import { detectWorkflowInconsistencies } from "@/src/modules/legal-intelligence-graph/rules/workflowConsistencyService";

function extractFacts(payload: Record<string, unknown>) {
  return {
    water_damage_disclosed: payload.water_damage_flag === true || payload.water_damage_flag === "true",
    tenant_present: payload.tenant_present === true || payload.tenant_present === "true",
    legal_dispute_present: payload.legal_dispute_flag === true || payload.legal_dispute_flag === "true",
    major_repair_reported: payload.renovations_flag === true || payload.renovations_flag === "true",
    environmental_issue_present: payload.environmental_flag === true || payload.environmental_flag === "true",
    occupancy_status: payload.owner_occupied === true || payload.owner_occupied === "true" ? "owner" : "other",
  };
}

export async function buildLegalGraphForDocument(documentId: string, actorUserId?: string) {
  const doc = await getDocumentAndProperty(documentId);
  if (!doc) throw new Error("Document not found");
  const propertyId = doc.listingId;
  await clearGraphForProperty(propertyId);

  const payload = (doc.draftPayload ?? {}) as Record<string, unknown>;
  const validation = runDeclarationValidationDeterministic(payload);
  const facts = extractFacts(payload);

  const propertyNode = await createGraphNode({ entityType: "property", entityId: propertyId, nodeType: "property", payload: { riskScore: doc.listing.riskScore, trustScore: doc.listing.trustScore } });
  const documentNode = await createGraphNode({ entityType: "document", entityId: doc.id, nodeType: "document", payload: { status: doc.status, completenessPercent: validation.completenessPercent } });
  await createGraphEdge({ fromNodeId: documentNode.id, toNodeId: propertyNode.id, edgeType: "belongs_to" });

  const factNodes: Record<string, string> = {};
  for (const [k, v] of Object.entries(facts)) {
    const n = await createGraphNode({ entityType: "fact", entityId: `${doc.id}:${k}`, nodeType: "fact", payload: { key: k, value: v } });
    factNodes[k] = n.id;
    await createGraphEdge({ fromNodeId: n.id, toNodeId: documentNode.id, edgeType: "derived_from" });
  }

  const issueGroups = [
    ...detectContradictions({ payload, validation, status: doc.status }),
    ...detectMissingDependencies({ payload, validation, signatures: doc.signatures }),
    ...detectReviewBlockers({ validation, status: doc.status }),
    ...detectSignatureBlockers({ validation, status: doc.status, signatures: doc.signatures }),
    ...detectWorkflowInconsistencies({ status: doc.status, signatures: doc.signatures, validation }),
  ] as Array<{
    issueType: string;
    severity: "info" | "warning" | "critical";
    title: string;
    message: string;
    metadata?: Record<string, unknown>;
    relatedFactKey?: string;
  }>;

  for (const issue of issueGroups) {
    await createGraphIssue({
      propertyId,
      issueType: issue.issueType,
      severity: issue.severity,
      sourceNodeId: documentNode.id,
      relatedNodeId: issue.relatedFactKey ? factNodes[issue.relatedFactKey] ?? null : null,
      title: issue.title,
      message: issue.message,
      metadata: issue.metadata,
    });
    if (actorUserId) {
      captureServerEvent(actorUserId, "legal_graph_issue_detected", { propertyId, issueType: issue.issueType, severity: issue.severity });
    }
  }

  if (actorUserId) {
    captureServerEvent(actorUserId, "legal_graph_rebuilt", { propertyId, documentId: doc.id, issueCount: issueGroups.length });
  }

  return { propertyId, documentId: doc.id, issueCount: issueGroups.length };
}
