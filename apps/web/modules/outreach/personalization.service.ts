/** Replace [token] style placeholders in draft bodies — caller supplies only non-secret fields. */
export function applyPersonalization(template: string, map: Record<string, string>): string {
  let out = template;
  for (const [k, v] of Object.entries(map)) {
    out = out.split(`[${k}]`).join(v);
  }
  return out;
}
