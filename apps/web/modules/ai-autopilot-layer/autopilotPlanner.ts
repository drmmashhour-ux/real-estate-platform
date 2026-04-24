/**
 * Proposes assistive actions from context — no side effects.
 */

import type { AutopilotLayerMode, AutopilotPlanContext, PlannedAutopilotAction } from "./types";
import { AUTOPILOT_DISCLAIMER_FR } from "./types";
import { isActionAllowedForMode } from "./autopilotPolicy";
import { requiresHumanApprovalForExecute } from "./autopilotPolicy";

function appendDisclaimer(reason: string): string {
  return `${reason}\n\n${AUTOPILOT_DISCLAIMER_FR}`;
}

export function planAutopilotActions(mode: AutopilotLayerMode, ctx: AutopilotPlanContext): PlannedAutopilotAction[] {
  if (mode === "OFF") return [];

  const out: PlannedAutopilotAction[] = [];

  const push = (p: PlannedAutopilotAction) => {
    if (!isActionAllowedForMode(p.actionKey, mode)) return;
    out.push({
      ...p,
      requiresApproval: requiresHumanApprovalForExecute(p.actionKey, mode),
      reasonFr: appendDisclaimer(p.reasonFr),
    });
  };

  if (ctx.representedStatus === "BUYER_NOT_REPRESENTED" || ctx.representedStatus === "buyer_not_represented") {
    push({
      actionKey: "suggest_broker_review",
      actionType: "governance",
      mode,
      riskLevel: "MEDIUM",
      reasonFr:
        "L’acheteur n’est pas représenté. Le système recommande une révision par un courtier afin de mieux protéger ses intérêts.",
    });
  }

  const clauseRisk = ctx.risks?.some(
    (r) =>
      (r.code?.toLowerCase().includes("warranty") || r.message?.toLowerCase().includes("garantie")) &&
      (r.severity === "high" || r.severity === "blocking")
  );
  if (clauseRisk) {
    push({
      actionKey: "suggest_clause_rewrite",
      actionType: "drafting",
      mode,
      riskLevel: "HIGH",
      reasonFr: "La clause d’exclusion de garantie doit être claire et non équivoque.",
    });
  }

  const missingFinancing =
    ctx.risks?.some((r) => r.code === "missing_financing_deadline") ||
    ctx.turboDraftStatus === "missing_financing_delay";
  if (missingFinancing) {
    push({
      actionKey: "suggest_missing_field",
      actionType: "drafting",
      mode,
      riskLevel: "MEDIUM",
      reasonFr: "Le délai de financement doit être précisé avant de finaliser la promesse d’achat.",
    });
  }

  const missingDeclaration =
    ctx.risks?.some((r) => r.code === "missing_seller_declaration") || ctx.contractBrainGate === "missing_declaration";
  if (missingDeclaration) {
    push({
      actionKey: "suggest_missing_document",
      actionType: "compliance",
      mode,
      riskLevel: "HIGH",
      reasonFr: "Déclaration du vendeur ou pièce obligatoire manquante — à compléter avant finalisation.",
    });
  }

  if (ctx.aiCriticalFindings === true) {
    push({
      actionKey: "suggest_admin_review",
      actionType: "review",
      mode,
      riskLevel: "CRITICAL",
      reasonFr:
        "Des constats IA critiques nécessitent une révision humaine avant toute trousse de signature ou d’offre.",
      payloadJson: { aiFindingsSummary: ctx.aiFindingsSummary ?? null },
    });
  }

  if (ctx.turboDraftStatus === "ready" && ctx.paymentStatus === "UNPAID") {
    push({
      actionKey: "prepare_payment_checkout",
      actionType: "payments",
      mode,
      riskLevel: "LOW",
      reasonFr: "Le paiement est requis avant l’export final du document. La plateforme peut préparer la caisse — sans débit automatique.",
    });
  }

  if (ctx.turboDraftStatus === "ready" && mode !== "ASSIST") {
    push({
      actionKey: "prepare_pdf_preview",
      actionType: "drafting",
      mode,
      riskLevel: "LOW",
      reasonFr: "Préparation d’aperçu PDF pour révision interne — aucun envoi automatique.",
    });
  }

  if (mode === "FULL_AUTOPILOT_APPROVAL" && ctx.turboDraftStatus === "ready" && !ctx.aiCriticalFindings) {
    push({
      actionKey: "prepare_signature_package",
      actionType: "package",
      mode,
      riskLevel: "MEDIUM",
      reasonFr: "Préparation d’une trousse de signature pour validation humaine explicite.",
    });
  }

  return out;
}
