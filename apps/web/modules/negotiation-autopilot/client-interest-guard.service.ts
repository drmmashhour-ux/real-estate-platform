/**
 * Blocks language that implies false competing bids or manufactured pressure — caller should strip from drafts if detected.
 */
export function flagCoercivePhrases(text: string): string[] {
  const t = text.toLowerCase();
  const flags: string[] = [];
  if (/\b(other offer|multiple offers|bid war|last chance today only)\b/i.test(t)) {
    flags.push("Possible high-pressure phrasing — verify factual basis before sending.");
  }
  return flags;
}
