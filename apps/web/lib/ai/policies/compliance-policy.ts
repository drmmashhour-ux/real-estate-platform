export const COMPLIANCE_DISCLAIMER =
  "This is not legal advice. For regulatory or contractual questions, consult a qualified professional. LECIPM Manager provides operational guidance only.";

export function withComplianceDisclaimer(text: string): string {
  if (text.includes("not legal advice")) return text;
  return `${text.trim()}\n\n— ${COMPLIANCE_DISCLAIMER}`;
}
