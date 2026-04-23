import type { OaciqAiBehaviorBundle, OaciqRuleEngineBundle } from "@/lib/compliance/oaciq/rule-engine.types";
import {
  PLATFORM_ASSISTANCE_CLAUSE_EN,
  PLATFORM_ASSISTANCE_CLAUSE_FR,
  SECTION_CLAUSE_PENDING_EN,
  SECTION_CLAUSE_PENDING_FR,
} from "@/lib/compliance/oaciq/clauses";

/**
 * Placeholder bundle until `{{SECTION_TITLE}}` + `{{PASTE_TEXT_OR_SUMMARY}}` are ingested into `OaciqComplianceSection`.
 * Replace `sectionKey`, titles, and rule keys to match the real guideline.
 */
export const PENDING_SECTION_KEY = "pending_oaciq_section";

export function pendingRuleEnginePlaceholder(): OaciqRuleEngineBundle {
  return {
    requiredActions: [
      "broker_final_manual_approval",
      "broker_confirms_residential_scope",
      "broker_confirms_no_autonomous_client_commitment_by_ai",
    ],
    forbiddenActions: [
      "ai_executed_purchase_or_offer_without_broker",
      "platform_guaranteed_outcome_language",
    ],
    conditionalChecks: [
      {
        id: "if_client_facing_communication_then_disclose_assistance",
        when: { field: "action_is_client_facing", equals: true },
        thenRequire: ["broker_disclosed_ai_assistance_and_limits", "broker_reviewed_output"],
      },
    ],
  };
}

export function pendingAiBehaviorPlaceholder(): OaciqAiBehaviorBundle {
  return {
    AI_CHECKLIST: [
      "Le courtier confirme-t-il que la situation relève du champ résidentiel et de sa compétence OACIQ ?",
      "Les documents officiels ou obligatoires requis par l'OACIQ sont-ils identifiés et complétés hors simple assistance IA ?",
      "Le courtier a-t-il relu intégralement tout contenu avant envoi au client ?",
    ],
    AI_WARNINGS: [
      "L'IA peut omettre des exigences contextuelles; valider avec les références officielles OACIQ.",
      "Aucune promesse de résultat ou de rendement ne doit figurer dans les communications.",
    ],
    AI_BLOCKS: [
      "Bloquer l'envoi si `broker_final_manual_approval` est absent.",
      "Bloquer toute action équivalente à un engagement définitif sans signature manuelle du courtier.",
    ],
  };
}

export function pendingSectionTitles() {
  return {
    sectionTitleFr: "{{SECTION_TITLE}} — contenu officiel non fourni (brouillon technique)",
    sectionTitleEn: "{{SECTION_TITLE}} — official content not provided (technical draft)",
    clauseFr: `${PLATFORM_ASSISTANCE_CLAUSE_FR}\n\n${SECTION_CLAUSE_PENDING_FR}`,
    clauseEn: `${PLATFORM_ASSISTANCE_CLAUSE_EN}\n\n${SECTION_CLAUSE_PENDING_EN}`,
  };
}
