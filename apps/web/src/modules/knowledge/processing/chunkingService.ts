/**
 * ~4 characters per token for English legal prose (deterministic budget).
 * 500–1000 tokens → ~2000–4000 characters per chunk.
 */
const CHARS_PER_TOKEN_APPROX = 4;
const DEFAULT_MIN_CHARS = 500 * CHARS_PER_TOKEN_APPROX;
const DEFAULT_MAX_CHARS = 1000 * CHARS_PER_TOKEN_APPROX;

export function splitIntoChunksByTokenBudget(
  text: string,
  minChars = DEFAULT_MIN_CHARS,
  maxChars = DEFAULT_MAX_CHARS,
): string[] {
  const clean = text.replace(/\r\n/g, "\n").replace(/[ \t]+/g, " ").trim();
  if (!clean) return [];

  const parts = clean.split(/\n+/).map((p) => p.trim()).filter(Boolean);
  const out: string[] = [];
  let cur = "";

  function flushIfReady(force = false) {
    if (!cur.trim()) return;
    if (cur.length >= minChars || force) {
      out.push(cur.trim());
      cur = "";
    }
  }

  for (const p of parts) {
    if (!cur.length) cur = p;
    else if (cur.length + 1 + p.length <= maxChars) cur = `${cur} ${p}`;
    else {
      flushIfReady(true);
      cur = p;
    }

    while (cur.length > maxChars) {
      const slice = cur.slice(0, maxChars);
      const space = slice.lastIndexOf(" ");
      const at = space > minChars ? space : maxChars;
      out.push(cur.slice(0, at).trim());
      cur = cur.slice(at).trim();
    }
  }
  flushIfReady(true);

  return out.length ? out : [clean.slice(0, maxChars)];
}

/** @deprecated Prefer splitIntoChunksByTokenBudget for legal books */
export function splitIntoChunks(text: string, maxChars = 900) {
  const clean = text.replace(/\s+/g, " ").trim();
  if (!clean) return [];
  const chunks: string[] = [];
  let i = 0;
  while (i < clean.length) {
    chunks.push(clean.slice(i, i + maxChars));
    i += maxChars;
  }
  return chunks;
}
