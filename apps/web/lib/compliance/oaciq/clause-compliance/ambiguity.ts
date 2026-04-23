/** Heuristic ambiguity patterns — flag for broker review; not a linguistic model. */

const ASAP_PATTERNS: RegExp[] = [
  /\bas soon as possible\b/i,
  /\bsoonest\b/i,
  /\bdès que possible\b/i,
  /\bdans les meilleurs délais\b/i,
  /\breasonable time\b/i,
  /\bdélai raisonnable\b/i,
  /\bpromptement\b/i,
  /\bwithout undue delay\b/i,
];

export function detectAmbiguousTiming(text: string): string | null {
  const t = text.trim();
  if (!t) return null;
  for (const re of ASAP_PATTERNS) {
    if (re.test(t)) {
      return "Vague timing expression — specify a calendar date, a fixed number of days, or a clear triggering event.";
    }
  }
  return null;
}

export function detectVagueBusinessDays(text: string): string | null {
  const t = text.trim();
  if (!t) return null;
  const mentions = /\b(business\s+days?|jours\s+ouvrables?|jours\s+ouvrables)\b/i.test(t);
  if (!mentions) return null;
  const numbered = /\b\d+\s*(business\s+days?|jours\s+ouvrables?)\b/i.test(t);
  if (!numbered) {
    return "« Business days » / jours ouvrables — préciser un nombre exact ou une date butoir.";
  }
  return null;
}

export function scanClauseTextForAmbiguity(text: string): string[] {
  const out: string[] = [];
  const a = detectAmbiguousTiming(text);
  if (a) out.push(a);
  const b = detectVagueBusinessDays(text);
  if (b) out.push(b);
  return out;
}
