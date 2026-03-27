const STOP = new Set([
  "the",
  "a",
  "an",
  "and",
  "or",
  "but",
  "in",
  "on",
  "at",
  "to",
  "for",
  "of",
  "as",
  "is",
  "was",
  "are",
  "be",
  "been",
  "it",
  "this",
  "that",
  "with",
  "from",
  "have",
  "has",
  "had",
  "not",
  "no",
  "yes",
  "i",
  "we",
  "you",
  "they",
  "my",
  "your",
  "me",
  "just",
  "very",
  "so",
  "too",
]);

/**
 * Simple word frequency for feedback text (English-ish), min length 3.
 */
export function countFeedbackWords(texts: string[], limit = 24): { word: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const raw of texts) {
    const t = raw.toLowerCase().replace(/[^a-z0-9\s'-]/gi, " ");
    for (const w of t.split(/\s+/)) {
      const word = w.replace(/^'+|'+$/g, "");
      if (word.length < 3 || STOP.has(word)) continue;
      counts.set(word, (counts.get(word) ?? 0) + 1);
    }
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, limit)
    .map(([word, count]) => ({ word, count }));
}
