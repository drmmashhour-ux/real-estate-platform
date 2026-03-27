import { buildRiskHighlightsFromValidation } from "@/src/modules/client-trust-experience/infrastructure/clientRiskService";
import type { RiskHighlight } from "@/src/modules/client-trust-experience/domain/clientExperience.types";
import type { DeclarationValidationResult } from "@/src/modules/seller-declaration-ai/domain/declaration.types";

export function generateRiskHighlights(validation: DeclarationValidationResult): RiskHighlight[] {
  return buildRiskHighlightsFromValidation(validation);
}
