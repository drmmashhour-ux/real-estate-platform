import { TurboDraftInput, TurboDraftResult } from "../turbo-form-drafting/types";
import { TrustBadge } from "./types";

export function generateTrustBadges(input: TurboDraftInput, result: TurboDraftResult): TrustBadge[] {
  const badges: TrustBadge[] = [];

  // 1. Notices reviewed
  const criticalNotices = result.notices.filter(n => n.severity === "CRITICAL");
  const allAcked = criticalNotices.length > 0 && criticalNotices.every(n => n.acknowledged);
  if (allAcked) {
    badges.push({
      badgeKey: "NOTICES_REVIEWED",
      labelFr: "Avis critiques lus",
      proofJson: { count: criticalNotices.length, timestamp: new Date() }
    });
  }

  // 2. Representation disclosed
  if (input.representedStatus !== "NOT_REPRESENTED" || input.answers.representationAck) {
    badges.push({
      badgeKey: "REPRESENTATION_DISCLOSED",
      labelFr: "Rôle divulgué",
      proofJson: { status: input.representedStatus }
    });
  }

  // 3. Warranty clarified
  if (input.answers.withoutWarranty !== undefined) {
    badges.push({
      badgeKey: "WARRANTY_CLARIFIED",
      labelFr: "Garantie précisée",
      proofJson: { withoutWarranty: input.answers.withoutWarranty }
    });
  }

  // 4. Inclusions verified
  if (input.answers.inclusions) {
    badges.push({
      badgeKey: "INCLUSIONS_VERIFIED",
      labelFr: "Inclusions listées",
      proofJson: { length: input.answers.inclusions.length }
    });
  }

  // 5. Privacy consent recorded
  if (input.answers.privacyConsent) {
    badges.push({
      badgeKey: "PRIVACY_CONSENT_RECORDED",
      labelFr: "Consentement Loi 25",
      proofJson: { accepted: true }
    });
  }

  // 6. AI review completed
  // @ts-ignore
  if (result.styleValidation) {
    badges.push({
      badgeKey: "AI_REVIEW_COMPLETED",
      labelFr: "Révision IA terminée",
      proofJson: { engine: "FormStyleValidationEngine" }
    });
  }

  // 7. Signature gate passed
  if (result.canProceed) {
    badges.push({
      badgeKey: "SIGNATURE_GATE_PASSED",
      labelFr: "Signature autorisée",
      proofJson: { readyAt: new Date() }
    });
  }

  return badges;
}
