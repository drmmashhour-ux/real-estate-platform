import type { LegalSourceAttribution } from "./legal-knowledge.types";

/** Short citation for logs, exports, and audit payloads (not a legal citation standard — broker verification required). */
export function buildCitationKey(a: LegalSourceAttribution): string {
  const p = a.page != null ? `p.${a.page}` : "np";
  return `${a.source}|${p}|${a.section.replace(/\s+/g, " ").slice(0, 80)}`;
}

export function formatCitationFootnote(a: LegalSourceAttribution): string {
  return `[${a.source}${a.page != null ? `, ${a.page}` : ""}] ${a.section}`;
}
