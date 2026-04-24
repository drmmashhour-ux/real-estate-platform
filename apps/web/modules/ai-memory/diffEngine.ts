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

function splitClauses(text: string): string[] {
  const t = normalize(text.replace(/<[^>]+>/g, " "));
  if (!t) return [];
  const byNumber = t.split(/\s(?=\d+[\.)]\s)/g).map(normalize).filter(Boolean);
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
      if (x.length < 12 || clause.length < 12) return false;
      const shorter = Math.min(x.length, clause.length);
      const longer = Math.max(x.length, clause.length);
      let same = 0;
      for (let k = 0; k < Math.min(x.length, clause.length); k++) {
        if (x[k] === clause[k]) same++;
      }
      return same / longer > 0.55;
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
