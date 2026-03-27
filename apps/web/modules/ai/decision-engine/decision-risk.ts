import type { DecisionRiskItem, RiskSeverity } from "./decision-types";

export type LoadedListingFsbo = {
  kind: "fsbo";
  id: string;
  title: string;
  priceCents: number;
  city: string;
  status: string;
  moderationStatus: string;
  descriptionLen: number;
  imageCount: number;
  hasDeclaration: boolean;
  docsCount: number;
};

export type LoadedListingShortTerm = {
  kind: "short_term";
  id: string;
  title: string;
  city: string;
  nightPriceCents: number;
  listingStatus: string;
  verificationStatus: string;
  maxGuests: number;
  cleaningFeeCents: number;
};

export type LoadedBooking = {
  id: string;
  nights: number;
  totalCents: number;
  status: string;
  checkIn: Date;
  checkOut: Date;
  guestFeeCents: number;
};

export type LoadedLead = {
  id: string;
  status: string;
  score: number;
  createdAt: Date;
  messageLen: number;
};

export type LoadedDeal = {
  id: string;
  status: string;
  priceCents: number;
  updatedAt: Date;
  milestonePending: number;
};

export type LoadedInvoice = {
  id: string;
  invoiceNumber: string;
  issuedAt: Date;
  /** paid | unpaid heuristic */
  paymentStatus: string;
  amountCents: number;
};

export type LoadedPlatform = {
  openDisputes: number;
  pendingPayouts: number;
  unpaidInvoicesHint: number;
  bookingsToday: number;
  revenueWeekCents: number;
};

function risk(
  type: string,
  severity: RiskSeverity,
  explanation: string,
  suggestedAction: string
): DecisionRiskItem {
  return { type, severity, explanation, suggestedAction };
}

/** Heuristic: price vs city median unknown — flag wide divergence only when absurd. */
export function risksForFsboListing(row: LoadedListingFsbo): DecisionRiskItem[] {
  const out: DecisionRiskItem[] = [];
  if (row.priceCents <= 0) {
    out.push(
      risk("price_anomaly", "high", "List price is missing or zero.", "Set a realistic list price before publishing.")
    );
  } else if (row.priceCents < 1_500_000) {
    out.push(
      risk("price_anomaly", "medium", "Price is unusually low for a whole-property listing — verify amount.", "Double-check price and currency.")
    );
  } else if (row.priceCents > 500_000_000) {
    out.push(
      risk("price_anomaly", "medium", "Price is very high — ensure this matches your market segment.", "Compare to recent comps in your area.")
    );
  }

  if (row.status === "ACTIVE" && row.docsCount < 1) {
    out.push(
      risk("missing_legal_documents", "high", "Published listing shows no uploaded documents in our snapshot.", "Upload required ownership/disclosure documents.")
    );
  }

  if (row.descriptionLen < 80) {
    out.push(
      risk("incomplete_listing", "medium", "Description is very short; buyers may bounce.", "Add room count, updates, and neighborhood context.")
    );
  }

  if (row.imageCount < 3) {
    out.push(
      risk("incomplete_listing", "medium", "Few photos reduce trust and conversion.", "Add at least 5 well-lit photos including kitchen and exterior.")
    );
  }

  if (!row.hasDeclaration) {
    out.push(
      risk("missing_legal_documents", "high", "Seller declaration not completed.", "Complete declaration before or right after publish per platform rules.")
    );
  }

  return out;
}

export function risksForShortTermListing(row: LoadedListingShortTerm): DecisionRiskItem[] {
  const out: DecisionRiskItem[] = [];
  if (row.nightPriceCents < 2000) {
    out.push(
      risk("price_anomaly", "low", "Nightly rate is very low — confirm it is intentional.", "Adjust pricing if this was a typo.")
    );
  }
  if (row.nightPriceCents > 500_000) {
    out.push(
      risk("price_anomaly", "medium", "Nightly rate is very high — ensure it matches positioning.", "Compare similar stays in your city.")
    );
  }
  if (row.listingStatus !== "PUBLISHED") {
    out.push(risk("incomplete_listing", "low", "Listing is not published yet.", "Complete verification and publish when ready."));
  }
  return out;
}

export function risksForBooking(row: LoadedBooking): DecisionRiskItem[] {
  const out: DecisionRiskItem[] = [];
  const avgNight = row.nights > 0 ? row.totalCents / row.nights : 0;
  if (row.nights === 1 && row.totalCents > 500_000) {
    out.push(
      risk("suspicious_booking", "medium", "Single night with very high total — review for fraud or data entry issues.", "Confirm guest identity and payment with support if unsure.")
    );
  }
  if (row.nights >= 28 && row.totalCents > 5_000_000) {
    out.push(
      risk("suspicious_booking", "low", "Long, high-value stay — ensure house rules and deposit are clear.", "Send a welcome message with access details.")
    );
  }
  if (avgNight > 250_000 && row.nights <= 2) {
    out.push(
      risk("suspicious_booking", "medium", "High average nightly rate for a short stay.", "Verify pricing and cleaning fee breakdown.")
    );
  }
  return out;
}

export function risksForLead(row: LoadedLead): DecisionRiskItem[] {
  const out: DecisionRiskItem[] = [];
  const ageHours = (Date.now() - row.createdAt.getTime()) / 36e5;
  if (ageHours > 48 && ["new", "NEW", "open", "OPEN", "pending", "PENDING"].includes(row.status)) {
    out.push(
      risk("delayed_response", "high", "Lead may be waiting > 48h without progression.", "Call or message the lead with next steps today.")
    );
  }
  if (row.score >= 75) {
    out.push(
      risk("high_value_lead", "medium", "Lead score is high — competitive follow-up matters.", "Prioritize this thread in your CRM.")
    );
  }
  if (row.messageLen < 20) {
    out.push(risk("incomplete_listing", "low", "Message is very short — qualify budget and timeline.", "Ask two clarifying questions."));
  }
  return out;
}

export function risksForDeal(row: LoadedDeal): DecisionRiskItem[] {
  const out: DecisionRiskItem[] = [];
  const staleDays = (Date.now() - row.updatedAt.getTime()) / 864e5;
  if (staleDays > 14 && !["closed", "cancelled"].includes(row.status.toLowerCase())) {
    out.push(
      risk("delayed_deal", "high", "Deal has not updated in two weeks.", "Schedule a milestone review with buyer and seller.")
    );
  }
  if (row.milestonePending > 3) {
    out.push(
      risk("delayed_deal", "medium", "Several milestones still pending.", "Clear blockers (financing, inspection) on paper.")
    );
  }
  return out;
}

export function risksForInvoice(row: LoadedInvoice): DecisionRiskItem[] {
  const out: DecisionRiskItem[] = [];
  if (row.paymentStatus !== "paid" && row.paymentStatus !== "PAID") {
    out.push(
      risk("unpaid_invoice", "high", "Invoice does not appear paid in snapshot.", "Follow up on payment or reconcile in finance tools.")
    );
  }
  return out;
}

export function risksForPlatformAdmin(row: LoadedPlatform): DecisionRiskItem[] {
  const out: DecisionRiskItem[] = [];
  if (row.openDisputes > 0) {
    out.push(
      risk("open_disputes", "critical", `${row.openDisputes} open dispute(s) require human review.`, "Open disputes queue and assign owners.")
    );
  }
  if (row.pendingPayouts > 5) {
    out.push(
      risk("unusual_payment_pattern", "medium", "Several host payouts appear blocked or pending.", "Review Stripe Connect health and booking holds.")
    );
  }
  if (row.unpaidInvoicesHint > 0) {
    out.push(
      risk("unpaid_invoice", "high", `${row.unpaidInvoicesHint} invoice(s) may need collection attention.`, "Reconcile accounts receivable.")
    );
  }
  return out;
}
