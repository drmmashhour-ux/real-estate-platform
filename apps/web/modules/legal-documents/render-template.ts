function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function flattenForTemplate(obj: unknown, prefix = ""): Record<string, string> {
  const out: Record<string, string> = {};
  if (obj === null || obj === undefined) return out;
  if (typeof obj !== "object") {
    if (prefix) out[prefix] = String(obj);
    return out;
  }
  if (Array.isArray(obj)) {
    if (prefix) out[prefix] = JSON.stringify(obj);
    return out;
  }
  for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (v === null || v === undefined) {
      out[key] = "";
    } else if (typeof v === "object" && !Array.isArray(v)) {
      Object.assign(out, flattenForTemplate(v, key));
    } else if (Array.isArray(v)) {
      out[key] = JSON.stringify(v);
    } else if (typeof v === "boolean" || typeof v === "number") {
      out[key] = String(v);
    } else {
      out[key] = String(v);
    }
  }
  return out;
}

/**
 * Renders `bodyHtml` by replacing `{{path.to.value}}` with HTML-escaped snapshot values.
 */
export function renderTemplateHtml(bodyHtml: string, snapshot: Record<string, unknown>): string {
  const flat = flattenForTemplate(snapshot);
  return bodyHtml.replace(/\{\{([\w.]+)\}\}/g, (_, path: string) => {
    const v = flat[path];
    if (v === undefined) return "";
    return escapeHtml(v);
  });
}
