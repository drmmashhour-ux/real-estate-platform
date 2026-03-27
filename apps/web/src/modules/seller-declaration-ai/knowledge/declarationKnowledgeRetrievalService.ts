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
