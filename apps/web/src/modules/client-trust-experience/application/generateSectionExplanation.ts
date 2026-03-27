import { buildClientSectionExplanation } from "@/src/modules/client-trust-experience/infrastructure/clientExplanationService";
import type { ClientSectionExplanation } from "@/src/modules/client-trust-experience/domain/clientExperience.types";

export function generateSectionExplanation(sectionKey: string, payload: Record<string, unknown>): ClientSectionExplanation {
  return buildClientSectionExplanation(sectionKey, payload);
}
