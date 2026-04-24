/**
 * Clause-oriented diff between AI draft text and final (broker/signed) text.
 */

export type RewrittenClause = { from: string; to: string };
export type ClauseDiffResult = {
  added: string[];
  removed: string[];
  rewritten: RewrittenClause[];
};

function normalize(s: string): string {
  return s.replace(/\s+/g, " ").trim();
}

function similarEnough(a: string, b: string): boolean {
  if (a.length < 12 || b.length < 12) return false;
  const wa = new Set(a.toLowerCase().split(/\s+/).filter(Boolean));
  const wb = new Set(b.toLowerCase().split(/\s+/).filter(Boolean));
  let inter = 0;
  for (const w of wa) {
    if (wb.has(w)) inter++;
  }
  const union = new Set([...wa, ...wb]).size;
  return union > 0 && inter / union >= 0.35;
}

function splitClauses(text: string): string[] {
  const t = normalize(text.replace(/<[^>]+>/g, " "));
  if (!t) return [];
  const byNumber = t
    .split(/(?=\b\d+[\.)]\s+)/g)
    .map(normalize)
    .filter(Boolean);
  if (byNumber.length > 1) return byNumber;
  return t.split(/\n\n+/g).map(normalize).filter(Boolean);
}

/**
 * Detect added / removed / rewritten clauses between original (e.g. AI) and final text blobs.
 */
export function computeDiff(original: string, final: string): ClauseDiffResult {
  const a = splitClauses(original);
  const b = splitClauses(final);
  const removed: string[] = [];
  const added: string[] = [];
  const rewritten: RewrittenClause[] = [];

  const usedB = new Set<number>();

  for (const clause of a) {
    const exact = b.findIndex((x, i) => !usedB.has(i) && x === clause);
    if (exact >= 0) {
      usedB.add(exact);
      continue;
    }
    const similar = b.findIndex((x, i) => {
      if (usedB.has(i)) return false;
      return similarEnough(clause, x);
    });
    if (similar >= 0) {
      usedB.add(similar);
      rewritten.push({ from: clause, to: b[similar] });
    } else {
      removed.push(clause);
    }
  }

  for (let i = 0; i < b.length; i++) {
    if (!usedB.has(i)) added.push(b[i]);
  }

  return { added, removed, rewritten };
}
