import type { LecipmTrustWorkflowMode } from "@prisma/client";

/**
 * Plain-language policy strings for UI — never claim regulated trust unless mode + legal setup support it.
 */
export function trustModeExplainer(mode: LecipmTrustWorkflowMode | null | undefined): {
  headline: string;
  detail: string;
  regulatedTrustClaim: false;
} {
  switch (mode) {
    case "tracking_only":
      return {
        headline: "Tracking only",
        detail:
          "LECIPM records requested amounts and statuses. Funds are not held by the platform; follow your brokerage / notary / financial institution procedures.",
        regulatedTrustClaim: false,
      };
    case "manual_trust_workflow":
      return {
        headline: "Manual trust workflow",
        detail:
          "Coordinates reminders and ledger entries while the broker or parties complete deposits through your authorized trust account or institution. LECIPM does not move money.",
        regulatedTrustClaim: false,
      };
    case "provider_connected":
      return {
        headline: "Provider-connected (when configured)",
        detail:
          "May link to an external payment or escrow provider. Status reflects provider events — confirm against your provider dashboard before relying on release timing.",
        regulatedTrustClaim: false,
      };
    case "notary_coordinated":
      return {
        headline: "Notary-coordinated funds",
        detail:
          "Coordinates file milestones with notary/closing; fund handling follows notarial practice and your instructions — not automated by LECIPM.",
        regulatedTrustClaim: false,
      };
    default:
      return {
        headline: "Not configured",
        detail: "Set a trust workflow mode to align reminders and ledger entries with how this file is handled.",
        regulatedTrustClaim: false,
      };
  }
}
