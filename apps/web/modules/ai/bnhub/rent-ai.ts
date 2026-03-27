import { buildBaseSystem } from "../core/ai-prompts";
import type { AiIntent, AiMessages } from "../core/types";

export function buildRentAiMessages(intent: AiIntent, feature: string, context: Record<string, unknown>): AiMessages | null {
  const system = buildBaseSystem("rent", intent);
  const userJson = JSON.stringify(context, null, 2);

  switch (feature) {
    case "landlord_description":
      return {
        system:
          system +
          " Help write a long-term rental description from structured landlord inputs; no invented legal terms.",
        user: `Task: Long-term rental description.\nContext:\n${userJson}`,
      };
    case "landlord_checklist":
      return {
        system:
          system +
          " List required info and documents landlords typically gather before listing (non-exhaustive).",
        user: `Task: Landlord checklist.\nContext:\n${userJson}`,
      };
    case "landlord_readiness":
      return {
        system:
          system +
          " Summarize document/readiness status from provided context.",
        user: `Task: Landlord document readiness.\nContext:\n${userJson}`,
      };
    case "tenant_compare":
      return {
        system:
          system +
          " Compare rental options on visible dimensions; neutral; no lease interpretation.",
        user: `Task: Tenant compare rentals.\nContext:\n${userJson}`,
      };
    case "tenant_costs":
      return {
        system:
          system +
          " Explain visible rent and fees in plain language; flag questions for landlord/closing steps.",
        user: `Task: Tenant cost explanation.\nContext:\n${userJson}`,
      };
    default:
      return null;
  }
}

export function rentOfflineFallback(feature: string, _context: Record<string, unknown>): string {
  switch (feature) {
    case "landlord_description":
      return "Offline mode: State rent term, utilities, parking, appliances, and pet policy clearly.";
    case "landlord_checklist":
      return "Offline mode: ID, ownership proof, insurance, lease template, and move-in condition docs are commonly needed.";
    case "landlord_readiness":
      return "Offline mode: Upload required documents and complete verification before publishing.";
    case "tenant_compare":
      return "Offline mode: Compare rent, commute, utilities included, lease length, and rules side by side.";
    case "tenant_costs":
      return "Offline mode: Add base rent + listed fees; confirm what's included with the landlord.";
    default:
      return "Offline AI: long-term rent flows use the platform listing and application steps.";
  }
}
