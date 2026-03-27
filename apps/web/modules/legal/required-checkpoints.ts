/**
 * Plain-English legal checkpoints (English first). Not legal advice; counsel should review for production.
 * Use with “I have read and understood” + “Accept and continue” patterns in UI.
 */

export const PLATFORM_PRINCIPLES_SHORT = [
  "Transparency: material information should be available before you commit to a transaction-critical step.",
  "Verification: identity, title, and authority should be verified where the platform requires it.",
  "Informed decision: tools and workflows support you; they do not replace inspections, expert advice, or legal counsel where needed.",
  "Traceability: ImmoContact and related logs help evidence how contact and steps occurred.",
  "Collaboration: brokers using the platform are expected to follow collaboration and disclosure rules shown in broker terms.",
] as const;

export const BUYER_ACKNOWLEDGMENT_PARAGRAPHS = [
  "Listing information may be incomplete or change. You should independently verify material facts (including condition, boundaries, zoning, and title) before you rely on them.",
  "Professional inspection, financing approval, and legal advice may be necessary for your situation.",
  "The platform provides structured information and workflow support. It does not guarantee a particular outcome, price, or timeline.",
] as const;

/** Shown before contact / formal request (Buyer Hub). */
export const BUYER_CONTACT_CHECKPOINT = {
  title: "Buyer acknowledgment",
  acceptLabel: "I have read and understood — Accept and continue",
  paragraphs: BUYER_ACKNOWLEDGMENT_PARAGRAPHS,
} as const;

/** Checklist copy before offer-like or high-commitment actions (use alongside signed buyer acknowledgment). */
export const BUYER_OFFER_PRECOMMIT_ITEMS = [
  "I have reviewed the listing details available to me.",
  "I have reviewed disclosures made available for this listing (where applicable).",
  "I have considered financing and affordability assumptions and understand they are not guaranteed.",
  "I understand that document review by a qualified professional may be required before I am bound.",
] as const;

export const BUYER_OFFER_PRECOMMIT = {
  title: "Confirm before you submit",
  acceptLabel: "I confirm the above — Continue",
  items: BUYER_OFFER_PRECOMMIT_ITEMS,
} as const;

export const SELLER_PUBLISH_CHECKPOINT = {
  title: "Seller publication requirements",
  acceptLabel: "I understand — Continue",
  items: [
    "Public information must be accurate to the best of my knowledge and supportable where the platform asks for confirmation or documents.",
    "Where a seller declaration is required, I will complete it before the listing is activated.",
    "I confirm I have authority to market this property (including representation by another person or entity where applicable).",
  ],
} as const;

export const LANDLORD_PUBLISH_CHECKPOINT = {
  title: "Long-term rental — landlord acknowledgment",
  acceptLabel: "I have read and understood — Accept and continue",
  items: [
    "I confirm I have the right to advertise and lease the property (ownership or legal authority).",
    "I will disclose material rental terms (rent, term, deposits, services) as required by the flow.",
    "I understand habitability and condition obligations depend on applicable law and the lease.",
  ],
} as const;

export const HOST_PUBLISH_CHECKPOINT = {
  title: "Host listing — accuracy and standards",
  acceptLabel: "I have read and understood — Accept and continue",
  items: [
    "I agree to host terms and will describe the property, amenities, and rules accurately.",
    "I acknowledge safety and cleanliness standards and applicable house rules.",
    "Special services (parking, shuttle, extras) will be clearly marked as included, extra fee, or subject to confirmation.",
  ],
} as const;

export const GUEST_BOOKING_CHECKPOINT = {
  title: "Guest acknowledgment — before payment",
  acceptLabel: "I have read and understood — Pay",
  items: [
    "I will follow property rules, local laws, and host instructions for safety and access.",
    "I understand cancellation, modification, and refund rules for this booking.",
    "I understand conduct, damage, and fine/suspension consequences may apply under platform and host terms.",
  ],
} as const;

export const TENANT_RENTAL_CHECKPOINT = {
  title: "Tenant acknowledgment — long-term rental",
  acceptLabel: "I have read and understood — Continue",
  items: [
    "I should review all information and documents before signing a lease.",
    "Additional documents or checks may be required by the landlord or by law.",
    "The platform is an intermediary providing workflow support; lease terms are between landlord and tenant.",
  ],
} as const;

export const BROKER_DUTY_REMINDERS = [
  "Disclosure: communicate material facts in a timely way.",
  "Verification: encourage clients to verify listing and title information.",
  "Objective advice: serve clients professionally and consistently with licence rules.",
  "Collaboration: co-operating brokers should present offers promptly where applicable.",
  "Remuneration / conflicts: disclose compensation and conflicts as required by law and platform rules.",
] as const;

export const MORTGAGE_DISCLOSURE_CHECKPOINT = {
  title: "Mortgage & financing disclosure",
  acceptLabel: "I have read and understood — Continue",
  items: [
    "Calculators and estimates are informational only and are not final approval or a commitment to lend.",
    "A licensed mortgage professional or lender must confirm eligibility, rate, and terms.",
    "Financial tools do not replace lender underwriting or professional advice.",
  ],
} as const;

/**
 * Balanced dispute-resolution wording for terms and templates — does not override governing law.
 */
export const STANDARD_DISPUTE_RESOLUTION_PARAGRAPH = `Where a dispute arises, parties are encouraged to use the platform’s internal review first when available. The parties may agree to conciliation or mediation. Arbitration may apply only if provided for in a signed agreement and permitted by law. Nothing in platform terms limits rights that applicable law grants, including access to courts where such access cannot lawfully be waived.`;

export const BROKER_COLLABORATION_SUMMARY = `Brokers using the platform are collaborators in a transparent process, not opposing parties solely by reason of platform introduction. Brokers agree to present offers promptly where applicable, communicate material disclosures in time, and not bypass platform-originated contacts that carry commission or traceability obligations. ImmoContact and related logs may be used to evidence platform-originated contact.`;
