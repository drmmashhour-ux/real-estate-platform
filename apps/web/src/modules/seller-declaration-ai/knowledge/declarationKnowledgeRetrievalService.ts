type KnowledgeItem = {
  id: string;
  sectionKey: string;
  kind: "guidance" | "example" | "explanation" | "followup_pattern";
  text: string;
  source: string;
};

const knowledge: KnowledgeItem[] = [
  { id: "k1", sectionKey: "water_damage", kind: "guidance", text: "Disclose when damage occurred, area affected, and remediation status.", source: "internal_drafting_book" },
  { id: "k2", sectionKey: "known_defects", kind: "example", text: "Known defect: minor basement seepage observed in spring 2023, repaired by contractor in June 2023.", source: "approved_wording_examples" },
  { id: "k3", sectionKey: "legal_disputes", kind: "followup_pattern", text: "If dispute exists, ask for status, parties involved, and whether resolved.", source: "internal_clause_notes" },
  { id: "k4", sectionKey: "tenant_lease_status", kind: "explanation", text: "Disclose active leases, end dates, and key obligations.", source: "internal_drafting_book" },
  { id: "k5", sectionKey: "renovations_repairs", kind: "guidance", text: "Where possible include date, contractor, and permit context.", source: "internal_clause_notes" },
  {
    id: "k6",
    sectionKey: "property_identity",
    kind: "guidance",
    text: "Choose the declaration path based on property type. Standard residential and undivided co-ownership follow DS-style disclosure, while divided co-ownership or condo fractions follow DSD-style disclosure.",
    source: "pillar_real_estate_books",
  },
  {
    id: "k7",
    sectionKey: "ownership_occupancy",
    kind: "explanation",
    text: "The seller declares facts to the best of their knowledge. If the seller does not know an answer, the explanation should be recorded instead of pretending certainty.",
    source: "pillar_real_estate_books",
  },
  {
    id: "k8",
    sectionKey: "inclusions_exclusions",
    kind: "guidance",
    text: "Inclusions and exclusions should remain precise because the final agreement must reflect the latest active terms and not rely on earlier negotiation drafts.",
    source: "pillar_drafting_book",
  },
  {
    id: "k9",
    sectionKey: "tenant_lease_status",
    kind: "guidance",
    text: "For income or tenant-occupied property, current lease information should be available to support the transaction file.",
    source: "pillar_real_estate_books",
  },
  {
    id: "k10",
    sectionKey: "additional_notes",
    kind: "followup_pattern",
    text: "If the seller cannot answer a point with certainty, prompt for a short details explanation similar to a D15-style clarification note.",
    source: "pillar_real_estate_books",
  },
  {
    id: "k11",
    sectionKey: "property_identity",
    kind: "explanation",
    text: "Brokered sale should begin with the brokerage contract path and required documents before the transaction advances into offer and closing stages.",
    source: "pillar_drafting_book",
  },
  {
    id: "k12",
    sectionKey: "additional_notes",
    kind: "guidance",
    text: "After acceptance, title examination and notary preparation become the next formal stage of the transaction; the platform should keep the seller aware of those upcoming obligations.",
    source: "pillar_real_estate_books",
  },
  {
    id: "k13",
    sectionKey: "ownership_occupancy",
    kind: "guidance",
    text: "A seller with broker must use the correct brokerage contract form for the property type, and amendments must be managed through the formal amendment path rather than ad hoc edits.",
    source: "pillar_drafting_book",
  },
  {
    id: "k14",
    sectionKey: "additional_notes",
    kind: "explanation",
    text: "Counter-proposals supersede earlier negotiation versions. The platform should surface the currently active terms, deadlines, and the latest accepted version only.",
    source: "pillar_drafting_book",
  },
  {
    id: "k15",
    sectionKey: "property_identity",
    kind: "guidance",
    text: "For divided co-ownership, collect information about contingency funds, co-ownership fees, syndicate documents, and special assessments because those factors materially affect the transaction.",
    source: "pillar_real_estate_books",
  },
  {
    id: "k16",
    sectionKey: "coownership_financials",
    kind: "guidance",
    text: "For divided co-ownership, the file should capture syndicate documents, financial statements, contingency-fund context, and any special assessment information before final approval.",
    source: "pillar_real_estate_books",
  },
  {
    id: "k17",
    sectionKey: "coownership_financials",
    kind: "explanation",
    text: "These answers help buyers understand the financial health and operating rules of the co-ownership before they rely on the declaration.",
    source: "pillar_drafting_book",
  },
  {
    id: "k18",
    sectionKey: "coownership_financials",
    kind: "followup_pattern",
    text: "If a special assessment or major repair is known, ask for timing, amount if known, and whether it is paid, pending, or under discussion.",
    source: "pillar_real_estate_books",
  },
];

function matchScore(text: string, query: string) {
  const q = query.toLowerCase();
  return q.split(/\s+/).filter(Boolean).reduce((score, token) => score + (text.toLowerCase().includes(token) ? 1 : 0), 0);
}

export function retrieveGuidanceBySection(sectionKey: string) {
  return knowledge.filter((k) => k.sectionKey === sectionKey && k.kind === "guidance");
}

export function retrieveExamplesByField(sectionKey: string, fieldKey: string) {
  const q = `${sectionKey} ${fieldKey}`;
  return knowledge
    .map((k) => ({ k, s: matchScore(`${k.sectionKey} ${k.text}`, q) }))
    .filter((x) => x.s > 0 && x.k.kind === "example")
    .sort((a, b) => b.s - a.s)
    .map((x) => x.k)
    .slice(0, 3);
}

export function retrieveExplanationContent(sectionKey: string) {
  return knowledge.filter((k) => k.sectionKey === sectionKey && k.kind === "explanation");
}

export function retrieveFollowUpPatterns(sectionKey: string) {
  return knowledge.filter((k) => k.sectionKey === sectionKey && k.kind === "followup_pattern");
}
