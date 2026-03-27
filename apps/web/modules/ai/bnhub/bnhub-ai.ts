import { buildBaseSystem } from "../core/ai-prompts";
import type { AiIntent, AiMessages } from "../core/types";

export function buildBnhubAiMessages(intent: AiIntent, feature: string, context: Record<string, unknown>): AiMessages | null {
  const system = buildBaseSystem("bnhub", intent);
  const userJson = JSON.stringify(context, null, 2);

  switch (feature) {
    case "host_description":
      return {
        system:
          system +
          " Draft stay description, amenities summary, and starter house rules. Align with provided facts only.",
        user: `Task: Host listing copy.\nContext:\n${userJson}`,
      };
    case "host_pricing":
      return {
        system:
          system +
          " Suggest nightly price ranges as estimates; mention seasonality if data provided.",
        user: `Task: Host pricing suggestion.\nContext:\n${userJson}`,
      };
    case "booking_summary":
      return {
        system:
          system +
          " Summarize booking: dates, guests, fees, special requests; flag unusual asks neutrally.",
        user: `Task: Booking summary for host.\nContext:\n${userJson}`,
      };
    case "review_response":
      return {
        system:
          system +
          " Draft a professional host response to a review; courteous and factual.",
        user: `Task: Review response draft.\nContext:\n${userJson}`,
      };
    case "host_operations":
      return {
        system:
          system +
          " Suggest cleaning reminders and turnover checklist items before next stay.",
        user: `Task: Host operations checklist.\nContext:\n${userJson}`,
      };
    case "guest_match":
      return {
        system:
          system +
          " Assess fit for family, pets, quiet stay, remote work using listing rules and amenities provided.",
        user: `Task: Guest stay match.\nContext:\n${userJson}`,
      };
    case "guest_trip":
      return {
        system:
          system +
          " Summarize fees, rules, and special services for the guest trip.",
        user: `Task: Guest trip summary.\nContext:\n${userJson}`,
      };
    case "guest_modification":
      return {
        system:
          system +
          " Explain possible consequences of modify/cancel before guest confirms — generic, not policy guarantees.",
        user: `Task: Modification / cancellation helper.\nContext:\n${userJson}`,
      };
    case "legal_action_risk":
      return {
        system:
          system +
          " For a short-term stay booking: note if dates, guest count, or house-rule conflicts could create disputes or cancellation exposure under typical platform content rules. Keep brief; not legal advice.",
        user: `Task: BNHub booking content-license risk hint.\nContext:\n${userJson}`,
      };
    default:
      return null;
  }
}

export function bnhubOfflineFallback(feature: string, _context: Record<string, unknown>): string {
  switch (feature) {
    case "host_description":
      return "Offline mode: Highlight space type, beds, Wi‑Fi, parking, and house rules guests must know.";
    case "host_pricing":
      return "Offline mode: Compare nearby nightly rates if shown; adjust for minimum nights and cleaning fee.";
    case "booking_summary":
      return "Offline mode: Re-read guest count, dates, add-ons, and special requests before approving.";
    case "review_response":
      return "Offline mode: Thank the guest, acknowledge specifics, and offer a constructive next step.";
    case "host_operations":
      return "Offline mode: Strip beds, restock supplies, check smoke alarms, and document damage before next check-in.";
    case "guest_match":
      return "Offline mode: Check pet policy, quiet hours, workspace, and stairs/access against your needs.";
    case "guest_trip":
      return "Offline mode: Confirm total with fees, check-in window, and house rules in the booking details.";
    case "guest_modification":
      return "Offline mode: Changes may affect price and refund eligibility — read the policy summary on the confirmation screen.";
    case "legal_action_risk":
      return "Offline mode: Confirm dates, guest count, and house rules match the listing before booking — mismatches are a common source of disputes.";
    default:
      return "Offline AI: use BNHub booking and listing screens for authoritative details.";
  }
}
