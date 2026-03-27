import { captureServerEvent } from "@/lib/analytics/posthog-server";
import { getLegalContext } from "@/src/modules/knowledge/retrieval/legalContextRetrievalService";
import { runDeclarationValidationDeterministic } from "@/src/modules/seller-declaration-ai/validation/declarationValidationService";

async function attachRetrievalRiskHints(
  result: ReturnType<typeof runDeclarationValidationDeterministic>,
  payload: Record<string, unknown>,
) {
  const terms = [...result.missingFields, ...result.knowledgeRuleBlocks].slice(0, 8).join(" ");
  const query =
    terms.trim() ||
    `seller disclosure ${String(payload.property_type ?? "")} ${String(payload.property_address ?? "")}`.trim() ||
    "seller declaration material facts";
  const hits = await getLegalContext(query, { audience: "seller", limit: 5 }).catch(() => []);
  return {
    ...result,
    knowledgeRiskHints: hits.map((h) => ({
      content: h.content.length > 900 ? `${h.content.slice(0, 897)}...` : h.content,
      sourceTitle: h.source.title,
      importance: h.importance,
      pageNumber: h.pageNumber,
    })),
  };
}

export async function runDeclarationValidation(args: { payload: Record<string, unknown>; actorUserId: string }) {
  const base = runDeclarationValidationDeterministic(args.payload);
  const result = await attachRetrievalRiskHints(base, args.payload);
  captureServerEvent(args.actorUserId, "declaration_validation_run", {
    isValid: result.isValid,
    completenessPercent: result.completenessPercent,
    contradictionCount: result.contradictionFlags.length,
  });
  if (result.contradictionFlags.length) {
    captureServerEvent(args.actorUserId, "declaration_contradiction_detected", { contradictionCount: result.contradictionFlags.length });
  }
  return result;
}
