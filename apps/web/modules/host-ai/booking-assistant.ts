/**
 * Advisory booking triage — highlights risks and a tentative hint only.
 * Never auto-accepts or auto-declines; host always decides in the product UI.
 */

export type BookingAssistantInput = {
  status: string;
  nights: number;
  checkIn: Date;
  checkOut: Date;
  totalCents: number | null;
  guestNotes: string | null;
  specialRequest: string | null;
  listingTitle: string;
  listingPartyAllowed: boolean;
  listingPetsAllowed: boolean;
  paymentStatus: string | null;
  guestTrustRiskLevel: "LOW" | "MEDIUM" | "HIGH" | null;
};

export type BookingAssistantResult = {
  /** Tentative hint for the host — not an automated action. */
  suggestedAction: "accept" | "reject" | "review";
  risks: string[];
  reasoning: string[];
  advisoryOnly: true;
};

function combinedGuestText(notes: string | null, special: string | null) {
  return `${notes ?? ""}\n${special ?? ""}`.toLowerCase();
}

export function suggestBookingAssistance(input: BookingAssistantInput): BookingAssistantResult {
  const reasoning: string[] = [
    "This is guidance only — verify identity, payment state, and house rules in your host tools before you decide.",
  ];
  const risks: string[] = [];

  if (input.status !== "AWAITING_HOST_APPROVAL" && input.status !== "PENDING") {
    return {
      suggestedAction: "review",
      risks: [],
      reasoning: [
        ...reasoning,
        `Booking status is ${input.status}; host approve/decline flows usually apply when status is AWAITING_HOST_APPROVAL or PENDING.`,
      ],
      advisoryOnly: true,
    };
  }

  const pay = (input.paymentStatus ?? "").toUpperCase();
  if (pay && pay !== "COMPLETED" && pay !== "SUCCEEDED") {
    risks.push(`Payment is not clearly completed (status: ${input.paymentStatus ?? "unknown"}).`);
  }

  if (input.guestTrustRiskLevel === "HIGH") {
    risks.push("Guest trust snapshot at booking time was HIGH — consider an extra screening message.");
  } else if (input.guestTrustRiskLevel === "MEDIUM") {
    risks.push("Guest trust snapshot was MEDIUM — a short clarifying message can reduce surprises.");
  }

  const text = combinedGuestText(input.guestNotes, input.specialRequest);
  if (text.includes("party") && !input.listingPartyAllowed) {
    risks.push("Guest text mentions a party; your listing disallows parties — align expectations before accepting.");
  }
  if ((text.includes("pet") || text.includes("dog") || text.includes("cat")) && !input.listingPetsAllowed) {
    risks.push("Guest text may reference pets; your listing does not allow pets unless you make an exception.");
  }

  const hoursToCheckIn = (input.checkIn.getTime() - Date.now()) / 3_600_000;
  if (hoursToCheckIn < 10 && hoursToCheckIn > 0 && text.replace(/\s+/g, " ").length > 80) {
    risks.push("Check-in is soon and the guest left a long note — confirm you can meet special requests in time.");
  }

  if (input.nights > 28) {
    risks.push("Long stay (28+ nights) — double-check cancellation terms and local regulations.");
  }

  const partyConflict = text.includes("party") && !input.listingPartyAllowed;
  if (partyConflict) {
    reasoning.push(
      "Guest messaging may conflict with house rules (party). Declining with a polite explanation is a common path if you cannot accommodate — still your decision.",
    );
    return { suggestedAction: "reject", risks, reasoning, advisoryOnly: true };
  }

  let suggestedAction: BookingAssistantResult["suggestedAction"] = "review";
  if (risks.length === 0 && (pay === "COMPLETED" || pay === "SUCCEEDED")) {
    suggestedAction = "accept";
    reasoning.push(
      "Payment shows as completed and no major structured risk flags surfaced; if dates and rules fit, accepting is reasonable — still confirm manually.",
    );
  } else if (risks.length > 0) {
    reasoning.push("Review highlighted items or message the guest before accepting.");
  } else {
    reasoning.push("No strong structured signals either way — use your standard vetting checklist.");
  }

  return { suggestedAction, risks, reasoning, advisoryOnly: true };
}
