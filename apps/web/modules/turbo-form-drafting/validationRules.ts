import { TurboDraftInput, TurboDraftRisk } from "./types";

export function runValidationRules(input: TurboDraftInput): TurboDraftRisk[] {
  const risks: TurboDraftRisk[] = [];
  const { answers, representedStatus, transactionType, propertyType } = input;

  // 1. Buyer not represented
  if (representedStatus === "NOT_REPRESENTED" && input.role === "BUYER") {
    risks.push({
      ruleKey: "BUYER_NOT_REPRESENTED",
      severity: "WARNING",
      messageFr: "L'acheteur n'est pas représenté par un courtier.",
      messageEn: "The buyer is not represented by a broker.",
      blocking: true,
    });
  }

  // 2. Seller not represented
  if (representedStatus === "NOT_REPRESENTED" && input.role === "SELLER") {
    risks.push({
      ruleKey: "SELLER_NOT_REPRESENTED",
      severity: "WARNING",
      messageFr: "Le vendeur n'est pas représenté par un courtier.",
      messageEn: "The seller is not represented by a broker.",
      blocking: false,
    });
  }

  // 3. Warranty exclusion
  if (answers.withoutWarranty === true) {
    risks.push({
      ruleKey: "WARRANTY_EXCLUSION",
      severity: "CRITICAL",
      messageFr: "Vente sans garantie légale détectée.",
      messageEn: "Sale without legal warranty detected.",
      blocking: true,
    });
  }

  // 4. Inclusions/Exclusions ambiguity
  if (answers.inclusions && answers.inclusions.toLowerCase().includes("électro")) {
    risks.push({
      ruleKey: "INCLUSION_AMBIGUITY",
      severity: "WARNING",
      messageFr: "Ambiguité possible dans les inclusions (appareils électroménagers). Veuillez spécifier la marque et le modèle.",
      messageEn: "Possible ambiguity in inclusions (appliances). Please specify brand and model.",
      blocking: false,
    });
  }

  // 5. Missing financing delay
  if (answers.financingRequired === true && !answers.financingDelay) {
    risks.push({
      ruleKey: "MISSING_FINANCING_DELAY",
      severity: "CRITICAL",
      messageFr: "Délai de financement manquant.",
      messageEn: "Financing delay missing.",
      blocking: true,
    });
  }

  // 6. Short financing delay
  if (answers.financingRequired === true && answers.financingDelay && parseInt(answers.financingDelay) < 10) {
    risks.push({
      ruleKey: "SHORT_FINANCING_DELAY",
      severity: "WARNING",
      messageFr: "Le délai de financement est court (moins de 10 jours).",
      messageEn: "Financing delay is short (less than 10 days).",
      blocking: false,
    });
  }

  // 7. EV charger ambiguity
  if (answers.evChargerAmbiguity === true) {
    risks.push({
      ruleKey: "EV_CHARGER_AMBIGUITY",
      severity: "WARNING",
      messageFr: "Ambiguité sur la borne de recharge pour véhicule électrique.",
      messageEn: "Ambiguity regarding the electric vehicle charging station.",
      blocking: false,
    });
  }

  // 8. Missing seller declarations (Placeholder check)
  if (input.formKey === "PROMISE_TO_PURCHASE" && !answers.sellerDeclarationsReview) {
    risks.push({
      ruleKey: "MISSING_SELLER_DECLARATIONS",
      severity: "CRITICAL",
      messageFr: "Les déclarations du vendeur n'ont pas été revues.",
      messageEn: "Seller declarations have not been reviewed.",
      blocking: true,
    });
  }

  // 9. Referral compensation
  if (answers.referralFees && parseFloat(answers.referralFees) > 0) {
    risks.push({
      ruleKey: "REFERRAL_COMPENSATION",
      severity: "INFO",
      messageFr: "Une rétribution de référencement est prévue.",
      messageEn: "A referral compensation is planned.",
      blocking: false,
    });
  }

  // 10. Missing inspection condition
  if (input.formKey === "PROMISE_TO_PURCHASE" && !answers.inspectionRequired) {
    risks.push({
      ruleKey: "MISSING_INSPECTION_CONDITION",
      severity: "WARNING",
      messageFr: "L'inspection n'est pas sélectionnée. Il est fortement recommandé d'inclure une condition d'inspection.",
      messageEn: "Inspection is not selected. It is highly recommended to include an inspection condition.",
      blocking: false,
    });
  }

  // 11. Right of Withdrawal mention (Law 25 + OACIQ)
  if (!answers.rightOfWithdrawalAck) {
    risks.push({
      ruleKey: "MISSING_WITHDRAWAL_ACK",
      severity: "CRITICAL",
      messageFr: "La mention du droit de dédit (3 jours) doit être reconnue.",
      messageEn: "The 3-day right of withdrawal must be acknowledged.",
      blocking: true,
    });
  }

  // 12. Privacy Consent (Law 25)
  if (!answers.privacyConsent) {
    risks.push({
      ruleKey: "MISSING_PRIVACY_CONSENT",
      severity: "CRITICAL",
      messageFr: "Le consentement à la politique de confidentialité (Loi 25) est requis.",
      messageEn: "Privacy policy consent (Law 25) is required.",
      blocking: true,
    });
  }

  // 13. Equitable Treatment (for unrepresented buyers)
  if (representedStatus === "NOT_REPRESENTED" && input.role === "BUYER" && !answers.equitableTreatmentAck) {
    risks.push({
      ruleKey: "MISSING_EQUITABLE_TREATMENT_ACK",
      severity: "CRITICAL",
      messageFr: "L'avis sur le traitement équitable doit être accepté par l'acheteur non représenté.",
      messageEn: "The fair treatment notice must be accepted by the unrepresented buyer.",
      blocking: true,
    });
  }

  // 14. OACIQ Buyer/Seller Guide Ack
  if (!answers.oaciqGuideAck) {
    risks.push({
      ruleKey: "MISSING_OACIQ_GUIDE_ACK",
      severity: "WARNING",
      messageFr: "Il est recommandé de prendre connaissance du guide de l'OACIQ.",
      messageEn: "It is recommended to review the OACIQ guide.",
      blocking: false,
    });
  }

  // 15. Movable vs Immovable ambiguity (Fixtures, etc.)
  if (answers.inclusions && (answers.inclusions.toLowerCase().includes("lustre") || answers.inclusions.toLowerCase().includes("rideau"))) {
    risks.push({
      ruleKey: "MOVABLE_AMBIGUITY",
      severity: "WARNING",
      messageFr: "Attention: Certains biens (lustres, rideaux) peuvent être considérés comme meubles ou immeubles. Veuillez préciser s'ils sont inclus.",
      messageEn: "Warning: Some items (chandeliers, curtains) can be considered movable or immovable. Please specify if they are included.",
      blocking: false,
    });
  }

  return risks;
}
