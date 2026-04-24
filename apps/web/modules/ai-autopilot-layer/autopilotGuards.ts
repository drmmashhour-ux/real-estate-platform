/**
 * Pre-flight guards — block execution when compliance / notices / draft / AI signals fail.
 */

import type { AutopilotLayerMode } from "./types";
import type { GuardResult } from "./types";
import { isActionAllowedForMode, isForbiddenActionKey } from "./autopilotPolicy";
import type { AutopilotPlanContext } from "./types";

export function guardActionKey(actionKey: string, mode: AutopilotLayerMode): GuardResult {
  if (isForbiddenActionKey(actionKey)) {
    return {
      ok: false,
      reason: "Forbidden action key for all modes.",
      reasonFr: "Action interdite par la politique de sécurité de la plateforme.",
      eventKey: "autopilot_guard_failed",
    };
  }
  if (!isActionAllowedForMode(actionKey, mode)) {
    return {
      ok: false,
      reason: "Action not allowed for current autopilot mode.",
      reasonFr: "Action non permise pour le mode autopilot actuel.",
      eventKey: "autopilot_guard_failed",
    };
  }
  return { ok: true };
}

export function guardExecutionContext(
  actionKey: string,
  mode: AutopilotLayerMode,
  ctx: AutopilotPlanContext
): GuardResult {
  const keyOk = guardActionKey(actionKey, mode);
  if (!keyOk.ok) return keyOk;

  if (ctx.noticesComplete === false) {
    return {
      ok: false,
      reason: "Mandatory notices incomplete.",
      reasonFr: "Avis ou avis de conformité requis manquants — exécution bloquée.",
      eventKey: "autopilot_guard_failed",
    };
  }

  if (ctx.contractBrainGate === "blocked" || ctx.contractBrainGate === "BLOCKED") {
    return {
      ok: false,
      reason: "Contract brain gate blocked.",
      reasonFr: "Verrou Contract Brain actif — exécution bloquée.",
      eventKey: "autopilot_guard_failed",
    };
  }

  if (ctx.turboDraftCanProceed === false) {
    return {
      ok: false,
      reason: "Turbo draft cannot proceed.",
      reasonFr: "Le brouillon ne peut pas progresser tant que les contrôles ne sont pas satisfaits.",
      eventKey: "autopilot_guard_failed",
    };
  }

  if (
    (actionKey === "prepare_signature_package" || actionKey === "prepare_offer_package") &&
    ctx.aiCriticalFindings === true
  ) {
    return {
      ok: false,
      reason: "Critical AI findings block signature/offer package preparation.",
      reasonFr: "Constats IA critiques — préparation de trousse de signature/offre bloquée.",
      eventKey: "autopilot_guard_failed",
    };
  }

  if (actionKey === "prepare_payment_checkout" && ctx.paymentStatus === "PAID") {
    return {
      ok: false,
      reason: "Payment already recorded.",
      reasonFr: "Paiement déjà enregistré — pas de nouvelle caisse requise.",
      eventKey: "autopilot_guard_failed",
    };
  }

  return { ok: true };
}
