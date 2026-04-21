/**
 * Educational step copy for Québec’s Rénoclimat-style pathway — illustrative only.
 * Users must follow official instructions from Transition énergétique Québec / program portals.
 */

/** Required on all assistant surfaces */
export const RENOCLIMAT_ASSISTANT_DISCLAIMER =
  "LECIPM assists your process but does not submit or validate applications. Official processing is handled by Rénoclimat.";

export const RENOCLIMAT_STEP_COUNT = 5 as const;

/** Keys persisted in `RenoclimatAssistantProgress.checklistJson` */
export type RenoclimatChecklistKey =
  | "registered_for_evaluation"
  | "pre_renovation_evaluation_complete"
  | "upgrades_completed_documented"
  | "post_renovation_evaluation_complete"
  | "grant_decision_received";

/** Ordered gates — first incomplete step is the active focus */
export const RENOCLIMAT_CHECKLIST_ORDER: RenoclimatChecklistKey[] = [
  "registered_for_evaluation",
  "pre_renovation_evaluation_complete",
  "upgrades_completed_documented",
  "post_renovation_evaluation_complete",
  "grant_decision_received",
];

export type RenoclimatStepDefinition = {
  step: number;
  /** Short progress label */
  label: string;
  /** Primary CTA sentence */
  headline: string;
  checklistTitle: string;
  instructions: string[];
  /** Combined tips: documents, timing, pitfalls */
  tips: string[];
};

export const RENOCLIMAT_STEPS: RenoclimatStepDefinition[] = [
  {
    step: 1,
    label: "Register",
    headline: "Register your property for an official evaluation pathway.",
    checklistTitle: "I registered my home with the official program (online or by phone as required).",
    instructions: [
      "Open or confirm your file with the official Rénoclimat / Transition énergétique Québec intake — not through LECIPM.",
      "Gather property identifiers (address, municipal roll, occupancy) exactly as used for taxes or cadastre.",
      "Choose whether you will coordinate directly with a licensed evaluator list or wait for official next steps.",
    ],
    tips: [
      "Documents: property tax bill, government ID matching the owner of record, recent utility account holder name.",
      "Timing: intake slots and call-back times vary; allow several business days for confirmation messages.",
      "Avoid: starting major renovation work before your pre-retrofit evaluation is booked — can affect incentive alignment.",
    ],
  },
  {
    step: 2,
    label: "Pre-evaluation",
    headline: "Schedule and complete your pre-renovation energy evaluation.",
    checklistTitle: "My pre-renovation (pre-work) evaluation appointment is completed.",
    instructions: [
      "Book a certified evaluator recognized for the program you are following — use only official directories.",
      "Prepare access to attic, mechanical room, windows/doors, and basement rim areas; clear a path for blower-door setup if used.",
      "Archive the evaluation report PDF and any required measure list — you will reference it before spending on work.",
    ],
    tips: [
      "Documents: photo ID, proof of residency, prior renovation invoices if the evaluator requests context.",
      "Timing: peak seasons can add 3–8+ week lead times — book early if you have contractor slots in mind.",
      "Avoid: partial demo that changes thermal boundaries before the pre-visit without evaluator guidance.",
    ],
  },
  {
    step: 3,
    label: "Upgrades",
    headline: "Complete recommended upgrades according to your approved measure plan.",
    checklistTitle: "Renovations were executed to match approved measures (with permits where required).",
    instructions: [
      "Sequence work so insulation, air sealing, and HVAC changes follow your written plan and local code.",
      "Keep dated quotes, RBQ-licensed contractor names, and invoices tied to each measure category.",
      "Photograph stages if your file needs as-built proof (e.g., insulation depth before drywall).",
    ],
    tips: [
      "Documents: contracts, invoices, permit numbers, product cut-sheets for equipment class (e.g., heat pump performance).",
      "Timing: long-lead equipment (windows, HP) can add 8–16+ weeks — pad your schedule around post-evaluation deadlines.",
      "Avoid: substituting measure types without an updated recommendation — mismatches risk grant reduction or denial.",
    ],
  },
  {
    step: 4,
    label: "Post-evaluation",
    headline: "Schedule your post-renovation evaluation to confirm installed performance.",
    checklistTitle: "Post-renovation verification / evaluation visit is completed.",
    instructions: [
      "When work is substantially complete and systems are commissioned, request the post-retrofit visit via official channels.",
      "Ensure mechanical systems can run during the visit and that attic/crawl access remains available.",
      "Retain the post report; it is the bridge between executed work and your financial assistance file.",
    ],
    tips: [
      "Documents: commissioning reports, ventilation balance notes, updated floor plans if layout changed.",
      "Timing: backlog can delay final sign-off — avoid listing or selling assumptions until paperwork is aligned.",
      "Avoid: hiding incomplete work — evaluators document what they can verify on the day of the visit.",
    ],
  },
  {
    step: 5,
    label: "Grant",
    headline: "Submit your incentive file and track the official grant decision.",
    checklistTitle: "I received my official decision (approved amount, pending, or denial with reasons).",
    instructions: [
      "Submit the financial assistance request exactly as instructed in the portal (some steps are time-bound).",
      "Double-check banking details and tax identifiers for incentive deposit or tax-credit pathways if applicable.",
      "If revised, respond to clarifications promptly — deadlines are enforced by administrators, not by LECIPM.",
    ],
    tips: [
      "Documents: consolidated PDFs of invoices, evaluator reports, and any compliance attestations requested.",
      "Timing: adjudication queues vary; retain proof of submission timestamps and acknowledgment emails.",
      "Avoid: assuming LECIPM inbox counts as program submission — only official portals determine eligibility.",
    ],
  },
];
