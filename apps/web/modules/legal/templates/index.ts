import { bookingAgreementTemplate } from "./booking-agreement";
import { brokerAgreementTemplate } from "./broker-agreement";
import { cancellationPolicyTemplate } from "./cancellation-policy";
import { rentalAgreementTemplate } from "./rental-agreement";
import type { LegalTemplateDefinition, LegalTemplateId } from "./types";

export type { LegalTemplateDefinition, LegalTemplateId } from "./types";

const REGISTRY: Record<LegalTemplateId, LegalTemplateDefinition> = {
  booking_agreement: bookingAgreementTemplate,
  rental_agreement: rentalAgreementTemplate,
  broker_agreement: brokerAgreementTemplate,
  cancellation_policy: cancellationPolicyTemplate,
};

export function listLegalTemplates(): LegalTemplateDefinition[] {
  return Object.values(REGISTRY);
}

export function getLegalTemplate(id: LegalTemplateId): LegalTemplateDefinition | undefined {
  return REGISTRY[id];
}

export function isLegalTemplateId(v: string): v is LegalTemplateId {
  return v in REGISTRY;
}
