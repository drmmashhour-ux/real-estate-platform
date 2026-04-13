import type { DeclarationSectionId } from "@/lib/fsbo/seller-declaration-schema";

export const SELLER_DECLARATION_HELP: Record<
  DeclarationSectionId,
  { title: string; explain: string; whatToFill: string; example: string }
> = {
  identity: {
    title: "Seller identity & authority",
    explain:
      "You must confirm you are the registered owner or have legal authority to sell. This mirrors disclosure expectations under Québec brokerage rules (OACIQ-style transparency). If a legal person (company), a lawyer or notary acting for sellers, or a representative under mandate signs or lists, Québec practice expects the scope of authority to be clear—upload supporting documents (mandate, corporate resolution, professional registration) where applicable. This platform checklist is not the official DS/DSD annex; not legal advice.",
    whatToFill:
      "Natural-person sellers: ID and contact per seller row. Company / lawyer / mandate path: check the capacity boxes, upload PDF or images evidencing authority, then complete the authority checkbox and notes (required only when a capacity option is selected). Standard individual owners with no capacity option may leave the authority attestation and notes empty.",
    example: "Jane Doe — sole owner per land registry; no pending litigation affecting title.",
  },
  conflict: {
    title: "Conflict of interest",
    explain:
      "Buyers must know if you are selling to someone related to you or if any relationship could affect the transaction.",
    whatToFill: "Answer the relationship questions honestly, then confirm you have disclosed any interest.",
    example: "Not selling to a family member; no known relationship with an identified buyer.",
  },
  description: {
    title: "Property description",
    explain: "You attest that the marketing description matches what you know about the property.",
    whatToFill: "Notes on anything buyers should verify (boundaries, measurements, shared driveways, easements).",
    example: "Lot size per municipal assessment; fence shared with neighbour to the east — verify at inspection.",
  },
  inclusions: {
    title: "Inclusions & exclusions",
    explain: "Appliances, fixtures, furniture, and equipment often cause disputes — list what stays and what goes.",
    whatToFill: "Included: items that sell with the home. Excluded: items you are taking (chandeliers, shed, etc.).",
    example: "Included: fridge, stove, dishwasher. Excluded: washer/dryer, basement freezer.",
  },
  condition: {
    title: "Property condition",
    explain: "Known defects and past issues must be disclosed; hiding material facts can create legal risk.",
    whatToFill: "Known defects, past water/fire issues, and any structural concerns you are aware of.",
    example: "Basement sump pump replaced 2022; small crack in foundation wall (east) — monitored, no active leak.",
  },
  renovations: {
    title: "Renovations & invoices",
    explain: "Renovations affect value and permits; invoices help buyers verify work.",
    whatToFill: "List major work with approximate years; say if invoices or permits are available.",
    example: "2019 roof replacement (invoice available); 2021 bathroom reno (permit filed with city).",
  },
  pool: {
    title: "Swimming pool",
    explain: "Pools have safety rules in Québec; buyers need to know compliance status.",
    whatToFill: "If no pool, mark accordingly. If yes, type (in-ground/above) and safety (fence, cover, municipal rules).",
    example: "In-ground; 4 ft fence; compliant with municipal by-law as of last inspection.",
  },
  inspection: {
    title: "Inspection acceptance",
    explain: "Buyers typically hire an inspector; accepting this reduces friction and sets expectations.",
    whatToFill: "Confirm you accept that the buyer may conduct inspections subject to your agreement on timing/access.",
    example: "Checkbox — standard residential inspection clause expected.",
  },
  condo: {
    title: "Condo / syndicate",
    explain: "Divided co-ownership follows a stronger DSD-style disclosure path. Condo buyers rely on syndicate minutes, financial statements, bylaws, contingency-fund context, and special-assessment information.",
    whatToFill: "If condo: confirm documents are available, add reserve / contingency-fund context, mention special assessments, and summarize relevant rules or common services.",
    example: "Minutes & financials available through syndicate manager; contingency fund reviewed in 2024 budget; special assessment $2k in 2023 already paid; pet rules and shared rooftop terrace disclosed.",
  },
  newConstruction: {
    title: "New construction / GCR",
    explain: "New homes may carry Garantie de construction résidentielle (GCR) warranty coverage in Québec.",
    whatToFill: "If new build: warranty registration and builder contact. If not applicable, leave section off via checkbox.",
    example: "GCR plan registered; builder: XYZ Inc., contact: …",
  },
  taxes: {
    title: "Taxes & costs",
    explain: "Municipal and school taxes are recurring; welcome tax (transfer) is a buyer cost — estimates are shown for transparency.",
    whatToFill: "Acknowledge tax figures are indicative and buyers must verify with a notary or municipality.",
    example: "Acknowledged — buyer to confirm welcome tax and tax bills at signing.",
  },
  additionalDeclarations: {
    title: "Details & additional declarations",
    explain:
      "Aligned with DS/DSD-style practice (e.g. clarifications similar to clause D15 in many brokerage declarations): explain gaps, prior-owner information, and anything not covered elsewhere. Each saved entry is timestamped like an amendment record.",
    whatToFill:
      "Use the main text for clarifications; tag related topics; attach supporting uploads if you have them; confirm the legal attestation; then save an entry to the history.",
    example:
      "Clarifying section 5: no active leak today; past basement seepage (2018) was repaired with invoice on file — see attached.",
  },
  final: {
    title: "Final declaration",
    explain: "The platform is not your lawyer, inspector, or notary — independent verification is essential.",
    whatToFill: "Confirm accuracy and that you understand the platform’s role limits.",
    example: "Legal confirmation checkboxes before publish.",
  },
};
