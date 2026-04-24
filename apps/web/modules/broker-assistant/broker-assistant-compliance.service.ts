import { DEFAULT_QUEBEC_LANGUAGE_POLICY } from "@/lib/compliance/quebec/language-policy";
import type {
  BrokerAssistantComplianceFlag,
  BrokerAssistantComplianceLevel,
  BrokerAssistantContext,
  MissingInformationItem,
} from "@/modules/broker-assistant/broker-assistant.types";

const COMMERCIAL_HINT =
  /commercial|industriel|bureau|entrepôt|multiplex\s*5|5\s*plex|6\s*plex|cap\s*rate|strip\s*mall/i;

function flag(
  id: string,
  code: string,
  messageFr: string,
  messageEn: string,
  level: BrokerAssistantComplianceFlag["level"],
): BrokerAssistantComplianceFlag {
  return { id, code, messageFr, messageEn, level };
}

/**
 * Compliance guidance layer — informational flags only; broker remains responsible for OACIQ compliance.
 */
export function evaluateBrokerAssistantCompliance(
  ctx: BrokerAssistantContext,
  missing: MissingInformationItem[],
): { level: BrokerAssistantComplianceLevel; flags: BrokerAssistantComplianceFlag[] } {
  const flags: BrokerAssistantComplianceFlag[] = [];

  if (ctx.fsboContext || ctx.transactionMode === "fsbo_neutral") {
    flags.push(
      flag(
        "fsbo_neutral",
        "FSBO_NEUTRAL_TOOL",
        "Contexte FSBO : l’assistant reste en mode neutre/outil — pas de représentation implicite ni de promesse de résultat.",
        "FSBO context: assistant stays neutral/tool mode — no implied representation or guaranteed outcome.",
        "warning",
      ),
    );
  }

  if (!ctx.fsboContext && ctx.transactionMode !== "fsbo_neutral") {
    if (!ctx.broker?.brokerDisclosureRecorded) {
      flags.push(
        flag(
          "broker_disclosure",
          "BROKER_DISCLOSURE",
          "Vérifiez la divulgation du courtier et les obligations d’information avant toute communication engageante.",
          "Verify broker disclosure and information duties before any binding communication.",
          "warning",
        ),
      );
    }
  }

  if (ctx.isPublicOrClientFacing && DEFAULT_QUEBEC_LANGUAGE_POLICY.requireFrenchForPublicContent) {
    flags.push(
      flag(
        "french_public",
        "FRENCH_PUBLIC_CONTENT",
        "Contenu public ou client : prévoir une version française conforme à la politique québécoise du produit.",
        "Public or client-facing content: plan a French version per Québec product policy.",
        "warning",
      ),
    );
  }

  const scopeBlob = [ctx.listing?.listingTypeHint, ctx.metadata?.dealType as string, ctx.currentDraftText]
    .filter(Boolean)
    .join(" ");
  if (COMMERCIAL_HINT.test(scopeBlob)) {
    flags.push(
      flag(
        "residential_scope",
        "RESIDENTIAL_SCOPE",
        "Ce dossier semble sortir du courtage résidentiel ciblé par LECIPM — validez le champ d’exercice OACIQ avant d’agir.",
        "This file may exceed LECIPM’s residential scope — validate your OACIQ licence category before acting.",
        "blocker",
      ),
    );
  }

  if (ctx.disclosures?.brokerHasInterest && !ctx.disclosures?.conflictOfInterestDeclared) {
    flags.push(
      flag(
        "conflict",
        "CONFLICT_DISCLOSURE",
        "Conflit d’intérêts possible : documentez et obtenez l’approbation du courtier responsable avant diffusion.",
        "Possible conflict of interest: document and obtain responsible broker approval before distribution.",
        "blocker",
      ),
    );
  }

  flags.push(
    flag(
      "binding_approval",
      "BINDING_REQUIRES_BROKER",
      "Toute étape engageante (signature, envoi d’offre, engagement contractuel) exige l’approbation manuelle du courtier.",
      "Any binding step (signature, offer dispatch, contractual commitment) requires manual broker approval.",
      "info",
    ),
  );

  const hasBlocker = flags.some((f) => f.level === "blocker");
  const highMissing = missing.some((m) => m.severity === "high");

  let level: BrokerAssistantComplianceLevel;
  if (hasBlocker) {
    level = "blocked_until_fixed";
  } else if (highMissing || flags.some((f) => f.level === "warning")) {
    level = "needs_review";
  } else {
    level = "safe";
  }

  return { level, flags };
}
