import { computeDeclarationCompleteness } from "@/src/modules/seller-declaration-ai/validation/declarationCompletenessService";
import { evaluateSellerWorkflowPillarRules } from "@/src/modules/seller-declaration-ai/knowledge/sellerWorkflowPillarRules";

export type KnowledgeRuleEvaluation = {
  blocks: string[];
  warnings: string[];
};

/**
 * Deterministic platform rules layered on top of uploaded legal knowledge (no LLM).
 * Blocks / warnings drive Approval Center and Case Command Center health scoring.
 */
export function evaluateDeclarationKnowledgeRules(payload: Record<string, unknown>): KnowledgeRuleEvaluation {
  const blocks: string[] = [];
  const warnings: string[] = [];

  const keys = Object.keys(payload).filter((k) => payload[k] !== undefined && payload[k] !== null && String(payload[k]).trim() !== "");
  if (keys.length === 0) {
    blocks.push("Missing seller declaration: no sections completed.");
  }

  const address = String(payload.property_address ?? "").trim();
  const ptype = String(payload.property_type ?? "").trim();
  if (!address) blocks.push("Missing identity: property address is required.");
  if (!ptype) blocks.push("Missing identity: property type is required.");

  const { completenessPercent } = computeDeclarationCompleteness(payload);
  if (completenessPercent > 0 && completenessPercent < 100) {
    warnings.push("Incomplete contract / declaration: finish all required sections before final approval.");
  }

  const pillar = evaluateSellerWorkflowPillarRules(payload);
  blocks.push(...pillar.blocks);
  warnings.push(...pillar.warnings);

  return { blocks, warnings };
}
