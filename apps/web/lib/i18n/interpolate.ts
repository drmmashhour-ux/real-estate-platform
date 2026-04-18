/**
 * Replaces `{key}` placeholders only — keeps unrelated `{` intact.
 * Pass **numeric** values as numbers so callers preserve formatting across locales (FR/AR copy uses same keys).
 */
export function interpolateMessage(
  template: string,
  vars?: Record<string, string | number>,
): string {
  if (!vars) return template;
  let out = template;
  for (const [k, v] of Object.entries(vars)) {
    out = out.replaceAll(`{${k}}`, String(v));
  }
  return out;
}
