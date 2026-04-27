/**
 * S2 — strip common XSS vectors from free-text (best-effort, not a full HTML parser).
 */
const SCRIPT = /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi;
const ON_EVT = /\s+on\w+\s*=\s*("([^"]|"")*"|'([^']|'')*'|[^\s>]+)/gi;
const HTML_TAGS = /<\/?[a-z][\s\S]*?>/gi;

export function s2StripHtmlish(input: string): string {
  return input.replace(SCRIPT, "").replace(ON_EVT, "").replace(HTML_TAGS, "");
}

export function s2SanitizeMultilineText(input: string, maxLen: number): string {
  const s = s2StripHtmlish(input).replace(/\0/g, "");
  if (s.length > maxLen) return s.slice(0, maxLen);
  return s;
}
