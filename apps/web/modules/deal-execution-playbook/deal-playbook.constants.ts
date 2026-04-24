export const DEAL_PLAYBOOK_STEP_KEYS = [
  "lead_intake",
  "property_selection",
  "offer_generation_ai",
  "broker_review_signature",
  "offer_submission",
  "negotiation",
  "conditions_inspection_financing",
  "notary_coordination",
  "closing",
  "payment_tracking",
] as const;

export type DealPlaybookStepKey = (typeof DEAL_PLAYBOOK_STEP_KEYS)[number];

export type PlaybookStepDefinition = {
  key: DealPlaybookStepKey;
  order: number;
  title: string;
  shortTitle: string;
  checklist: string[];
  aiSuggestions: string[];
};

export const DEAL_PLAYBOOK_STEPS: PlaybookStepDefinition[] = [
  {
    key: "lead_intake",
    order: 0,
    title: "Lead intake",
    shortTitle: "Intake",
    checklist: [
      "Confirm buyer identity and capacity (OACIQ rules).",
      "Record motivation, budget band, and timeline in CRM.",
      "Attach any mandatory brokerage disclosures to the file.",
    ],
    aiSuggestions: [
      "Use the CRM lead card to centralize contact history before property shortlisting.",
      "Flag dual agency or conflict scenarios early in the file notes.",
    ],
  },
  {
    key: "property_selection",
    order: 1,
    title: "Property selection",
    shortTitle: "Property",
    checklist: [
      "Link the CRM listing (or FSBO record) to the deal.",
      "Verify inclusions/exclusions with the listing file.",
      "Book visits and log conditions that matter to the buyer.",
    ],
    aiSuggestions: [
      "Cross-check co-ownership declarations when the asset is divided co-ownership.",
      "Align buyer budget with lender pre-qualification before drafting an offer.",
    ],
  },
  {
    key: "offer_generation_ai",
    order: 2,
    title: "Offer generation (AI assist)",
    shortTitle: "Offer draft",
    checklist: [
      "Generate the AI offer draft from deal + listing context.",
      "Edit purchase price, deposit, and protective clauses to match facts.",
      "Confirm deadlines align with lender and inspection realities.",
    ],
    aiSuggestions: [
      "Open Dashboard → Deal → Auto offer draft to produce a traceable starting package.",
      "Compare aggressive / balanced / safe price bands before locking numbers.",
    ],
  },
  {
    key: "broker_review_signature",
    order: 3,
    title: "Broker review + signature",
    shortTitle: "Review & sign",
    checklist: [
      "Review every clause for accuracy versus the brokerage file.",
      "Approve the Promise-to-Purchase in the legal document engine.",
      "Complete broker digital signature where your policy requires it.",
    ],
    aiSuggestions: [
      "Run the broker-assistant checklist on promise-to-purchase drafts when enabled.",
      "Never send externally until the legal artifact shows broker approval.",
    ],
  },
  {
    key: "offer_submission",
    order: 4,
    title: "Offer submission",
    shortTitle: "Submit",
    checklist: [
      "Transmit the promise through your office’s official channel (not ad-hoc messaging).",
      "Log submission time and counterpart acknowledgement.",
      "Preserve an immutable snapshot / PDF per brokerage policy.",
    ],
    aiSuggestions: [
      "After dispatch from the legal engine, confirm the buyer received the signing path.",
    ],
  },
  {
    key: "negotiation",
    order: 5,
    title: "Negotiation",
    shortTitle: "Negotiate",
    checklist: [
      "Track counters in negotiation threads or structured amendments.",
      "Document material changes in writing only.",
      "Refresh financing and inspection timing if price or dates move.",
    ],
    aiSuggestions: [
      "Use Deal → Negotiation strategies for advisory price bands (not instructions).",
    ],
  },
  {
    key: "conditions_inspection_financing",
    order: 6,
    title: "Conditions (inspection / financing)",
    shortTitle: "Conditions",
    checklist: [
      "Monitor inspection and financing deadlines daily.",
      "Upload reports and lender commitments to the deal room.",
      "Waive or declare conditions only with written buyer direction.",
    ],
    aiSuggestions: [
      "Surface overdue conditions automatically in this playbook when deadlines pass.",
    ],
  },
  {
    key: "notary_coordination",
    order: 7,
    title: "Notary coordination",
    shortTitle: "Notary",
    checklist: [
      "Select notary and send the draft deed package.",
      "Confirm appointment date works for lender discharge and parties.",
      "Track deed readiness notes until signing.",
    ],
    aiSuggestions: [
      "Populate notary coordination early once conditions are trending clear.",
    ],
  },
  {
    key: "closing",
    order: 8,
    title: "Closing",
    shortTitle: "Closing",
    checklist: [
      "Confirm final statement of adjustments draft.",
      "Verify keys, utilities, and post-close undertakings.",
      "Archive executed deeds and disbursement confirmations.",
    ],
    aiSuggestions: [
      "If trust/ledger tools are enabled, reconcile expected vs received funds before marking closed.",
    ],
  },
  {
    key: "payment_tracking",
    order: 9,
    title: "Payment tracking",
    shortTitle: "Payments",
    checklist: [
      "Record commission and referral payouts per office policy.",
      "Match platform or trust ledger entries to the closing statement.",
      "Close the CRM deal outcome for analytics.",
    ],
    aiSuggestions: [
      "Link any deal-scoped payments so finance dashboards stay accurate.",
    ],
  },
];
