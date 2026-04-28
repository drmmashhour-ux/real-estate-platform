/**
 * Deterministic narration copy — static strings only. No interpolation, user data, or secrets.
 */
export type NarrationEntry = {
  title?: string;
  text: string;
};

export const narrationRegistry: Record<string, NarrationEntry> = {
  "/demo": {
    title: "Welcome",
    text: "This is the SYBNB marketplace. Listings are verified and ranked using trust and quality signals.",
  },
  "/listing": {
    text: "This listing is owned by a verified host. Availability and pricing are managed automatically.",
  },
  "/sybnb": {
    text: "Browse approved listings in the marketplace; unsafe inventory stays hidden behind operator gates.",
  },
  ACTION_REQUEST_BOOKING: {
    text: "When a guest requests a booking, the system validates trust signals before allowing confirmation.",
  },
  ACTION_HOST_CONFIRM: {
    text: "The host confirms the booking. Risk checks are applied before proceeding.",
  },
  ACTION_PAYMENT_BLOCKED: {
    text: "Payments are intentionally blocked in demo mode to ensure zero financial risk.",
  },
  "/admin/dr-brain": {
    text: "Dr. Brain monitors the system in real time and detects anomalies before they impact users.",
  },
  "/admin/sybnb/reports": {
    text: "Operator reporting summarizes marketplace trust and booking quality without exposing sensitive records.",
  },
};
