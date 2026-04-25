import type { AssistantIntentKind } from "@/lib/ai/assistant-router";
import type { AssistantPageContext } from "@/lib/ai/assistant-router";

const SAFE =
  "I can’t confirm details that aren’t shown on this page. Use the listing or contact flow for specifics.";

export function responseForIntent(
  intent: AssistantIntentKind,
  context: AssistantPageContext
): string {
  switch (intent) {
    case "booking_help":
      return [
        "For BNHUB stays: pick your check-in and check-out dates first — the total updates with taxes and fees before you pay.",
        "Complete guest details, then pay securely through checkout. You’ll receive confirmation with next steps.",
      ].join(" ");

    case "unlock_help":
      return [
        "Owner contact unlock is available on eligible listings from the listing page.",
        "Complete any verification shown, then purchase unlock if offered — you’ll get contact details only after a successful unlock.",
        SAFE,
      ].join(" ");

    case "broker_help":
      return "You can request a platform broker from listing CTAs where available, or sign up as a client from the main menu. Exact availability depends on the listing.";

    case "mortgage_help":
      return "Mortgage tools and expert requests live under Finance / Mortgage in the app when enabled for your account. I can’t quote rates — speak to a licensed broker.";

    case "host_help":
      return "To list a stay or property: open Host / List your property from BNHUB or the seller hub, complete verification, then publish when ready.";

    case "listing_explainer":
      if (context.stayId) {
        return [
          "On this stay page: review photos, amenities, house rules, and cancellation terms.",
          "Select dates and guest count to see the full price, then continue to secure checkout.",
          SAFE,
        ].join(" ");
      }
      if (context.listingId) {
        return [
          "Review price, location, and features on this listing. Use Save or Compare when available.",
          "To contact the seller or broker, use the buttons on the listing — some contacts require unlock.",
          SAFE,
        ].join(" ");
      }
      return "Open a listing to ask about that property. I can explain platform steps without inventing listing facts.";

    case "general_platform_help":
      return "Try: search by city and price, save listings, or use BNHUB for short stays. Ask how booking or contact unlock works anytime.";

    case "compare_listings":
      return "To compare, open two listings or use Save — then ask again. I can contrast price, beds, and size when both are available.";

    case "unsupported":
      return "I didn’t catch that. Try: “2 bedroom condo in Montreal under 650k”, “short stay in Laval this weekend”, or “How do I book a stay?”";

    default:
      return "How can I help you search or navigate the platform?";
  }
}
