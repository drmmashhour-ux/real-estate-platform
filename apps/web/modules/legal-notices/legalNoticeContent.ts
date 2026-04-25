/**
 * LECIPM Legal Notice Content Library — standardized user-facing notices (FR primary, EN secondary).
 * Not legal advice; confirm with qualified counsel for your situation.
 */

export type LegalNoticeSeverity = "critical" | "warning" | "info";

export type LegalNoticeKey =
  | "LIMITED_ROLE_NOTICE"
  | "WARRANTY_EXCLUSION_NOTICE"
  | "PARTIAL_WARRANTY_NOTICE"
  | "INCLUSION_EXCLUSION_NOTICE"
  | "PRIVACY_NOTICE"
  | "REFERRAL_NOTICE"
  | "FINANCING_NOTICE"
  | "AI_NOTICE";

export type LegalNoticeEntry = {
  key: LegalNoticeKey;
  titleFr: string;
  contentFr: string;
  titleEn: string;
  contentEn: string;
  severity: LegalNoticeSeverity;
  /** When true, workflow should block until acknowledged (CRITICAL). */
  requiresAcknowledgment: boolean;
};

/**
 * Rendering policy (UI):
 * - critical → must acknowledge (`requiresAcknowledgment: true`)
 * - warning → show notice; optional “recommended” acknowledgment in `LegalNoticeCard`
 * - info → display only
 */
export const LegalNoticeContentLibrary: Record<LegalNoticeKey, LegalNoticeEntry> = {
  LIMITED_ROLE_NOTICE: {
    key: "LIMITED_ROLE_NOTICE",
    titleFr: "⚠️ Absence de représentation",
    contentFr:
      "Le courtier avec qui vous interagissez représente exclusivement les intérêts du vendeur. Il ne peut pas vous conseiller ni défendre vos intérêts. Vous bénéficiez uniquement d’un traitement équitable. Il est fortement recommandé de faire appel à votre propre courtier afin d’être représenté.",
    titleEn: "⚠️ No representation",
    contentEn:
      "The broker you are dealing with represents the seller’s interests only. They cannot advise you or advocate for your interests. You are entitled to fair treatment only. You are strongly encouraged to retain your own broker to be represented.",
    severity: "critical",
    requiresAcknowledgment: true,
  },
  WARRANTY_EXCLUSION_NOTICE: {
    key: "WARRANTY_EXCLUSION_NOTICE",
    titleFr: "⚠️ Exclusion de garantie légale",
    contentFr:
      "L’immeuble est vendu sans garantie légale de qualité. Cela signifie que vous renoncez à certains recours en cas de vices cachés, sauf si le vendeur a volontairement dissimulé un défaut important. Cette clause doit être bien comprise avant de poursuivre.",
    titleEn: "⚠️ Exclusion of legal warranty",
    contentEn:
      "The immovable is sold without legal warranty of quality. This means you give up certain remedies for hidden defects, except where the seller willfully concealed a material defect. This clause must be clearly understood before you proceed.",
    severity: "critical",
    requiresAcknowledgment: true,
  },
  PARTIAL_WARRANTY_NOTICE: {
    key: "PARTIAL_WARRANTY_NOTICE",
    titleFr: "⚠️ Garantie légale partielle",
    contentFr:
      "La garantie légale peut être exclue en totalité ou en partie. Il est important de préciser clairement les éléments concernés ainsi que les vendeurs visés par cette exclusion afin d’éviter toute ambiguïté.",
    titleEn: "⚠️ Partial legal warranty",
    contentEn:
      "The legal warranty may be excluded in whole or in part. It is important to state clearly which elements are covered and which sellers are affected by the exclusion, to avoid ambiguity.",
    severity: "warning",
    requiresAcknowledgment: false,
  },
  INCLUSION_EXCLUSION_NOTICE: {
    key: "INCLUSION_EXCLUSION_NOTICE",
    titleFr: "📋 Inclusions et exclusions",
    contentFr:
      "Les inclusions et exclusions doivent être clairement définies dans le contrat. Toute ambiguïté peut entraîner un litige entre les parties. Assurez-vous que chaque élément est précisé.",
    titleEn: "📋 Inclusions and exclusions",
    contentEn:
      "Inclusions and exclusions must be clearly defined in the contract. Any ambiguity may lead to a dispute between the parties. Ensure every item is specified.",
    severity: "warning",
    requiresAcknowledgment: false,
  },
  PRIVACY_NOTICE: {
    key: "PRIVACY_NOTICE",
    titleFr: "🔒 Protection des renseignements personnels",
    contentFr:
      "Vos renseignements personnels sont collectés et utilisés conformément à la Loi 25. Ils ne seront partagés qu’avec votre consentement explicite. Vous pouvez retirer votre consentement à tout moment.",
    titleEn: "🔒 Personal information",
    contentEn:
      "Your personal information is collected and used in accordance with Law 25 (Québec). It will be shared only with your express consent. You may withdraw consent at any time.",
    severity: "critical",
    requiresAcknowledgment: true,
  },
  REFERRAL_NOTICE: {
    key: "REFERRAL_NOTICE",
    titleFr: "ℹ️ Référencement et rétribution",
    contentFr:
      "Le courtier peut recevoir une rétribution pour la référence à un autre professionnel. Cette information doit être divulguée de manière transparente avant toute communication de vos renseignements personnels.",
    titleEn: "ℹ️ Referrals and compensation",
    contentEn:
      "The broker may receive compensation for referring you to another professional. This must be disclosed clearly before any of your personal information is shared.",
    severity: "info",
    requiresAcknowledgment: false,
  },
  FINANCING_NOTICE: {
    key: "FINANCING_NOTICE",
    titleFr: "💰 Condition de financement",
    contentFr:
      "Un délai raisonnable doit être prévu pour l’obtention du financement. L’absence ou un délai insuffisant peut entraîner l’annulation de la promesse d’achat.",
    titleEn: "💰 Financing condition",
    contentEn:
      "A reasonable period must be allowed to obtain financing. A missing or insufficient delay may result in cancellation of the promise to purchase.",
    severity: "warning",
    requiresAcknowledgment: false,
  },
  AI_NOTICE: {
    key: "AI_NOTICE",
    titleFr: "🤖 Assistance automatisée",
    contentFr:
      "Ce document a été généré ou assisté par un système automatisé. Il doit être révisé attentivement avant utilisation. Il ne constitue pas un avis juridique.",
    titleEn: "🤖 Automated assistance",
    contentEn:
      "This document was generated or assisted by an automated system. It must be reviewed carefully before use. It is not legal advice.",
    severity: "warning",
    requiresAcknowledgment: false,
  },
};

export function getLegalNotice(key: LegalNoticeKey): LegalNoticeEntry {
  return LegalNoticeContentLibrary[key];
}

export function getLegalNoticeTitleAndBody(key: LegalNoticeKey, locale: "fr" | "en"): { title: string; body: string } {
  const n = getLegalNotice(key);
  return locale === "fr" ? { title: n.titleFr, body: n.contentFr } : { title: n.titleEn, body: n.contentEn };
}
