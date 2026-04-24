import type { AiDraftInput, AiRiskFinding } from "@/modules/ai-drafting-correction/types";

function fullText(input: AiDraftInput): string {
  const parts = input.draftSections.map((s) => `${s.title ?? ""}\n${s.bodyText ?? ""}\n${s.bodyHtml ?? ""}`);
  return `${parts.join("\n")}\n${(input.notices ?? []).join("\n")}\n${JSON.stringify(input.answers ?? {})}`;
}

function hasRe(text: string, re: RegExp): boolean {
  return re.test(text);
}

/**
 * Deterministic risk rules — always run first; blocking flags drive Turbo status + signature readiness.
 */
export function runDeterministicCorrectionRules(input: AiDraftInput): AiRiskFinding[] {
  const t = fullText(input);
  const lower = t.toLowerCase();
  const findings: AiRiskFinding[] = [];

  const push = (f: AiRiskFinding) => findings.push(f);

  if (hasRe(lower, /\bclause\b/) && hasRe(lower, /vague|flou|peut-être|éventuellement/) && !hasRe(lower, /précis|exclusivement/)) {
    push({
      findingKey: "VAGUE_CLAUSE",
      severity: "WARNING",
      sectionKey: undefined,
      messageFr: "Une clause semble trop vague pour un engagement clair.",
      messageEn: "A clause appears too vague for a clear undertaking.",
      suggestedFixFr: "Remplacer les formulations floues par des obligations précises et mesurables.",
      suggestedFixEn: "Replace vague wording with precise, measurable obligations.",
      blocking: false,
    });
  }

  if (
    hasRe(lower, /inclu|exclu/) &&
    hasRe(lower, /mobilier|stipend|accessoire/) &&
    !hasRe(lower, /liste.*annexe|annexe.*liste/)
  ) {
    push({
      findingKey: "AMBIGUOUS_INCLUSION_EXCLUSION",
      severity: "WARNING",
      sectionKey: undefined,
      messageFr: "L’inclusion ou l’exclusion d’éléments n’est pas assez déterminée.",
      messageEn: "Inclusion/exclusion of items is not sufficiently determined.",
      suggestedFixFr: "Ajouter une liste à l’annexe ou préciser article par article.",
      suggestedFixEn: "Add a schedule or specify item by item.",
      blocking: false,
    });
  }

  if (hasRe(lower, /garantie.*légale|legal warranty/) && hasRe(lower, /exclu|sans garantie|no warranty/) && !hasRe(lower, /qualifié|partiel|limité.*vendeur/)) {
    push({
      findingKey: "WARRANTY_EXCLUSION_UNCLEAR",
      severity: "CRITICAL",
      sectionKey: "LEGAL_WARRANTY",
      messageFr: "La clause d’exclusion de garantie n’est pas assez claire.",
      messageEn: "The legal warranty exclusion clause is not sufficiently clear.",
      suggestedFixFr:
        "Préciser si l’exclusion vise uniquement le vendeur immédiat ou aussi les propriétaires antérieurs, et s’il s’agit d’une exclusion partielle ou totale qualifiée.",
      suggestedFixEn: "Clarify whether exclusion applies only to immediate seller or prior owners, and partial vs total qualified exclusion.",
      blocking: true,
    });
  }

  if (
    input.transactionContext?.buyerRepresented === false &&
    !hasRe(lower, /rôle limité|non représenté|courtier.*autre partie|oaciq/i)
  ) {
    push({
      findingKey: "MISSING_BUYER_REPRESENTATION_NOTICE",
      severity: "CRITICAL",
      sectionKey: "REPRESENTATION",
      messageFr: "Avis de représentation / rôle limité du courtier possiblement absent ou non référencé.",
      messageEn: "Buyer limited-representation / broker role notice may be missing.",
      suggestedFixFr: "Intégrer l’avis OACIQ sur le rôle limité lorsque l’acheteur n’est pas représenté.",
      suggestedFixEn: "Include OACIQ limited-role notice when buyer is not represented.",
      blocking: true,
    });
  }

  if (!hasRe(lower, /déclaration.*vendeur|seller declaration|annexe.*déclaration/i) && hasRe(lower, /promesse|promise to purchase|achat/)) {
    push({
      findingKey: "MISSING_SELLER_DECLARATION_REF",
      severity: "WARNING",
      sectionKey: "DECLARATIONS",
      messageFr: "Référence aux déclarations du vendeur non détectée.",
      messageEn: "Seller declaration reference not detected.",
      suggestedFixFr: "Référencer la déclaration du vendeur ou l’annexe pertinente.",
      suggestedFixEn: "Reference seller declaration or relevant schedule.",
      blocking: false,
    });
  }

  if (hasRe(lower, /financement|hypothèque|prêt/) && !hasRe(lower, /délai.*financement|jours.*financement|financing delay/i)) {
    push({
      findingKey: "MISSING_FINANCING_DELAY",
      severity: "WARNING",
      sectionKey: "FINANCING",
      messageFr: "Aucun délai de financement clair détecté.",
      messageEn: "No clear financing delay detected.",
      suggestedFixFr: "Ajouter un délai de financement en jours ouvrables.",
      suggestedFixEn: "Add a financing delay in business days.",
      blocking: false,
    });
  }

  if (hasRe(lower, /financement/) && hasRe(lower, /(\b[1-5]\s*jours?\b|\b7\s*jours?\b)/)) {
    push({
      findingKey: "SHORT_FINANCING_DELAY",
      severity: "WARNING",
      sectionKey: "FINANCING",
      messageFr: "Délai de financement très court — risque d’insuffisance pour institution.",
      messageEn: "Very short financing delay — may be insufficient for lenders.",
      suggestedFixFr: "Envisager un délai plus réaliste (souvent 10–15 jours ouvrables ou plus).",
      suggestedFixEn: "Consider a more realistic delay (often 10–15+ business days).",
      blocking: false,
    });
  }

  if (!hasRe(lower, /identit.*vérifi|verification.*identit|pièce d’identité/i)) {
    push({
      findingKey: "MISSING_IDENTITY_VERIFICATION_REF",
      severity: "INFO",
      sectionKey: "IDENTITY",
      messageFr: "Aucune référence explicite à la vérification d’identité.",
      messageEn: "No explicit identity verification reference.",
      suggestedFixFr: "Ajouter une mention de vérification d’identité conforme aux politiques du courtier.",
      suggestedFixEn: "Add identity verification per brokerage policy.",
      blocking: false,
    });
  }

  if (hasRe(lower, /nom|adresse|courriel|email|téléphone/) && !hasRe(lower, /loi 25|law 25|renseignements personnels|consentement/i)) {
    push({
      findingKey: "MISSING_LAW25_CONSENT",
      severity: "WARNING",
      sectionKey: "PRIVACY",
      messageFr: "Données personnelles mentionnées sans consentement Loi 25 apparent.",
      messageEn: "Personal data mentioned without apparent Law 25 consent.",
      suggestedFixFr: "Ajouter un consentement à la collecte/communication conforme à la Loi 25.",
      suggestedFixEn: "Add Law 25-aligned consent for collection/sharing.",
      blocking: false,
    });
  }

  const dateMatches = t.match(/\b(20\d{2}|19\d{2})[-/](0?[1-9]|1[0-2])[-/](0?[1-9]|[12]\d|3[01])\b/g);
  if (dateMatches && new Set(dateMatches).size > 1 && hasRe(lower, /signature|signé/) && hasRe(lower, /échéance|occupation/)) {
    push({
      findingKey: "INCONSISTENT_DATES",
      severity: "WARNING",
      sectionKey: "DATES",
      messageFr: "Plusieurs dates détectées — vérifier la cohérence (signature, occupation, délais).",
      messageEn: "Multiple dates detected — verify consistency.",
      suggestedFixFr: "Aligner les dates et renvoyer à un calendrier unique en annexe.",
      suggestedFixEn: "Align dates and reference a single timeline schedule.",
      blocking: false,
    });
  }

  if (!hasRe(lower, /(\d[\d\s,]*\s*\$|\$\s*\d|prix.*\d)/) && hasRe(lower, /promesse|achat|vente/)) {
    push({
      findingKey: "MISSING_PRICE",
      severity: "CRITICAL",
      sectionKey: "PRICE",
      messageFr: "Prix ou contrepartie monétaire non détecté.",
      messageEn: "Price or monetary consideration not detected.",
      suggestedFixFr: "Inscrire le prix en chiffres et en lettres ou marquer l’information manquante.",
      suggestedFixEn: "State price in figures and words or mark missing information.",
      blocking: true,
    });
  }

  if (!hasRe(lower, /vendeur|acheteur|seller|buyer/) || !hasRe(lower, /adresse.*(rue|road|st\b)|\d{3,5}\s+[a-zàâäéèêëïîôùûüç]/i)) {
    push({
      findingKey: "MISSING_PARTIES_OR_ADDRESS",
      severity: "CRITICAL",
      sectionKey: "PARTIES",
      messageFr: "Parties ou adresse immobilière incomplète ou absente.",
      messageEn: "Parties or property address incomplete or missing.",
      suggestedFixFr: "Compléter les parties et l’adresse cadastrale ou civique complète.",
      suggestedFixEn: "Complete parties and full civic/cadastral address.",
      blocking: true,
    });
  }

  if (hasRe(lower, /garantie.*approbation|approbation garantie|guaranteed approval|100\s*%.*accord/i)) {
    push({
      findingKey: "UNSUPPORTED_LEGAL_CLAIM",
      severity: "CRITICAL",
      sectionKey: "CLAIMS",
      messageFr: "Formulation risquée suggérant une garantie d’approbation.",
      messageEn: "Risky wording suggesting guaranteed approval.",
      suggestedFixFr: "Remplacer par une obligation de diligence raisonnable sans garantie de résultat.",
      suggestedFixEn: "Replace with reasonable efforts without guaranteed outcome.",
      blocking: true,
    });
  }

  if (hasRe(lower, /tel quel|as is|without warranty of quality/i) && !hasRe(lower, /état|inspection|exclusion.*qualité/)) {
    push({
      findingKey: "UNCLEAR_AS_IS",
      severity: "WARNING",
      sectionKey: "CONDITION",
      messageFr: "Mention « tel quel » sans précision sur l’inspection ou les exclusions.",
      messageEn: "“As is” mention without inspection or exclusion clarity.",
      suggestedFixFr: "Préciser les inspections, relevés et portée des exclusions.",
      suggestedFixEn: "Clarify inspections, reports, and scope of exclusions.",
      blocking: false,
    });
  }

  if (hasRe(lower, /borne|recharge|ev|véhicule électrique|charging station/i) && !hasRe(lower, /incluse|exclue|sans droit|n’appartient pas/)) {
    push({
      findingKey: "EV_CHARGER_AMBIGUITY",
      severity: "WARNING",
      sectionKey: "CHATTELS",
      messageFr: "Équipement de recharge (EV) mentionné sans inclusion/exclusion claire.",
      messageEn: "EV charging equipment mentioned without clear inclusion/exclusion.",
      suggestedFixFr: "Clarifier si la borne, le câblage et le droit d’usage sont inclus ou exclus.",
      suggestedFixEn: "Clarify whether station, wiring, and usage rights are included or excluded.",
      blocking: false,
    });
  }

  if (hasRe(lower, /meuble|mobilier/) && hasRe(lower, /immeuble|lot/) && !hasRe(lower, /annexe|liste.*mobilier/)) {
    push({
      findingKey: "MOVABLE_IMMOVABLE_AMBIGUITY",
      severity: "WARNING",
      sectionKey: "INCLUSIONS",
      messageFr: "Risque de confusion entre biens meubles et immeuble.",
      messageEn: "Risk of confusion between movable and immovable property.",
      suggestedFixFr: "Lister les meubles inclus/exclus en annexe.",
      suggestedFixEn: "Schedule included/excluded movables.",
      blocking: false,
    });
  }

  return findings;
}
