/**
 * Format captions for social APIs: body text, optional CTA, hashtags grouped at the end.
 */

export function formatSocialCaption(input: {
  caption: string;
  hashtags?: string[];
  cta?: string;
}): string {
  const body = input.caption.trim();
  const cta = input.cta?.trim();
  const tags = normalizeHashtags(input.hashtags ?? []);

  const parts: string[] = [];
  if (body) parts.push(body);
  if (cta) parts.push(cta);

  let text = parts.join("\n\n").trim();
  if (tags.length) {
    const tagLine = tags.map((t) => (t.startsWith("#") ? t : `#${t}`)).join(" ");
    text = text ? `${text}\n\n${tagLine}` : tagLine;
  }
  return text.slice(0, 2200);
}

function normalizeHashtags(raw: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const h of raw) {
    const t = h.replace(/^#+/, "").trim();
    if (!t || seen.has(t.toLowerCase())) continue;
    seen.add(t.toLowerCase());
    out.push(t);
  }
  return out;
}
