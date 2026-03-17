/**
 * Simple template engine: {{placeholder}}, {{#if key}}...{{/if}}, {{#each list}}...{{/each}}.
 */

import type { DocumentGenerationContext } from "./types";

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function get(ctx: DocumentGenerationContext, path: string): unknown {
  const parts = path.trim().split(".");
  let v: unknown = ctx;
  for (const p of parts) {
    if (v == null || typeof v !== "object") return undefined;
    v = (v as Record<string, unknown>)[p];
  }
  return v;
}

/** Replace {{key}} and {{key.subkey}} with values from context. */
function replacePlaceholders(template: string, ctx: DocumentGenerationContext): string {
  return template.replace(/\{\{([^#/][^}]*)\}\}/g, (_, key) => {
    const v = get(ctx, key.trim());
    if (v == null) return "";
    const s = String(v);
    return escapeHtml(s);
  });
}

/** Process {{#if key}}...{{/if}} – show block if key is truthy. */
function processConditionals(template: string, ctx: DocumentGenerationContext): string {
  const ifRegex = /\{\{#if\s+([^}]+)\}\}([\s\S]*?)\{\{\/if\}\}/g;
  return template.replace(ifRegex, (_, key, block) => {
    const v = get(ctx, key.trim());
    const truthy = v !== undefined && v !== null && v !== false && v !== "" && (typeof v !== "number" || v !== 0);
    return truthy ? processBlock(block, ctx) : "";
  });
}

/** Process {{#each list}}...{{/each}} – repeat block for each item; use this.xxx inside. */
function processEach(template: string, ctx: DocumentGenerationContext): string {
  const eachRegex = /\{\{#each\s+([^}]+)\}\}([\s\S]*?)\{\{\/each\}\}/g;
  return template.replace(eachRegex, (_, key, block) => {
    const list = get(ctx, key.trim());
    if (!Array.isArray(list)) return "";
    return list
      .map((item, i) => {
        const itemCtx = { ...ctx, this: item, index: i, first: i === 0, last: i === list.length - 1 };
        return processBlock(block, itemCtx);
      })
      .join("");
  });
}

function processBlock(block: string, ctx: DocumentGenerationContext): string {
  let out = block;
  out = replacePlaceholders(out, ctx);
  out = processConditionals(out, ctx);
  out = processEach(out, ctx);
  return out;
}

/**
 * Render template with context: placeholders, {{#if}}, {{#each}}.
 */
export function renderTemplate(template: string, context: DocumentGenerationContext): string {
  let out = template;
  out = processConditionals(out, context);
  out = processEach(out, context);
  out = replacePlaceholders(out, context);
  return out;
}
