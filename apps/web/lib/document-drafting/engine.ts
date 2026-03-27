/**
 * Template engine for document generation.
 * Supports {{placeholder}}, {{#if key}}...{{/if}}, {{#each list}}...{{/each}}.
 */

export type TemplateContext = Record<string, unknown>;

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function get(ctx: TemplateContext, path: string): unknown {
  const parts = path.trim().split(".");
  let current: unknown = ctx;
  for (const p of parts) {
    if (current == null || typeof current !== "object") return undefined;
    current = (current as Record<string, unknown>)[p];
  }
  return current;
}

function renderValue(value: unknown): string {
  if (value == null) return "";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (Array.isArray(value)) return value.map(renderValue).join(", ");
  if (typeof value === "object") return JSON.stringify(value);
  return "";
}

/**
 * Render a template string with the given context.
 * - {{key}} or {{key.sub}} → replaced with value (HTML-escaped)
 * - {{#if key}}...{{/if}} → included if key is truthy
 * - {{#each list}}...{{/each}} → repeated for each item; inside use {{this}} or {{.}}
 */
export function renderTemplate(template: string, context: TemplateContext): string {
  let out = template;

  // {{#each list}}...{{/each}}
  const eachRegex = /\{\{#each\s+(\w+(?:\.\w+)*)\}\}([\s\S]*?)\{\{\/each\}\}/g;
  out = out.replace(eachRegex, (_, path, body) => {
    const list = get(context, path);
    if (!Array.isArray(list)) return "";
    return list
      .map((item: unknown) => {
        const itemObj =
          typeof item === "object" && item !== null ? (item as Record<string, unknown>) : {};
        const itemCtx = { ...context, ...itemObj, this: item, ".": item };
        return renderTemplate(body, itemCtx);
      })
      .join("");
  });

  // {{#if key}}...{{/if}}
  const ifRegex = /\{\{#if\s+(\w+(?:\.\w+)*)\}\}([\s\S]*?)\{\{\/if\}\}/g;
  out = out.replace(ifRegex, (_, path, body) => {
    const val = get(context, path);
    if (val === undefined || val === null || val === false || val === "" || (Array.isArray(val) && val.length === 0))
      return "";
    return renderTemplate(body, context);
  });

  // {{key}} — simple placeholder (last so nested keys work after each/if)
  const placeholderRegex = /\{\{(\w+(?:\.\w+)*)\}\}/g;
  out = out.replace(placeholderRegex, (_, path) => {
    const val = get(context, path);
    return escapeHtml(renderValue(val));
  });

  return out;
}

/**
 * Extract list of placeholder keys referenced in the template (for validation).
 */
export function extractPlaceholders(template: string): string[] {
  const keys = new Set<string>();
  const simple = /\{\{(\w+(?:\.\w+)*)\}\}/g;
  let m: RegExpExecArray | null;
  while ((m = simple.exec(template)) !== null) keys.add(m[1]);
  const ifKeys = /\{\{#if\s+(\w+(?:\.\w+)*)\}\}/g;
  while ((m = ifKeys.exec(template)) !== null) keys.add(m[1]);
  const eachKeys = /\{\{#each\s+(\w+(?:\.\w+)*)\}\}/g;
  while ((m = eachKeys.exec(template)) !== null) keys.add(m[1]);
  return Array.from(keys);
}
