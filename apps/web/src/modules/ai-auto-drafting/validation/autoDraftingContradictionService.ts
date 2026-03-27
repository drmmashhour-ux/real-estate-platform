import { detectDeclarationContradictions } from "@/src/modules/seller-declaration-ai/validation/declarationContradictionService";

/** Re-use seller declaration contradiction detection when facts map to declaration fields. */
export function detectAutoDraftContradictions(facts: Record<string, unknown>): string[] {
  return detectDeclarationContradictions(facts);
}
