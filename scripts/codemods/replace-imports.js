/**
 * LECIPM — rewrite `@/lib/*` (and related) imports to `@repo/*` workspace packages.
 *
 * Prerequisite: implementations must exist under packages (each package under its own src/).
 * Safe to run for `@/lib/db` after packages/db holds the canonical Prisma client.
 * Do NOT run full mappings for `@/lib/ai` until apps/web/lib/ai has been copied into packages/ai/src.
 *
 * Usage (repo root):
 *   pnpm exec jscodeshift -t scripts/codemods/replace-imports.js apps/web --extensions=ts,tsx --parser=tsx
 *
 * Dry run:
 *   pnpm exec jscodeshift -t scripts/codemods/replace-imports.js apps/web --extensions=ts,tsx --parser=tsx --print --dry
 *
 * Optional: also rewrite @/components → @repo/ui (packages/ui must contain those modules):
 *   LECIPM_CODEMOD_COMPONENTS=1 pnpm exec jscodeshift ...
 */

module.exports = function transformer(file, api) {
  const j = api.jscodeshift;
  const root = j(file.source);

  const replaceMap = {
    "@/lib/db": "@repo/db",
    "@/lib/prisma": "@repo/db",
    "@/lib/tenant": "@repo/tenant",
    "@/lib/ai": "@repo/ai",
    "@/lib/copilot": "@repo/ai/copilot",
    "@/lib/digest": "@repo/ai/digest",
    "@/lib/autopilot": "@repo/ai/autopilot",
    "@/lib/suggestions": "@repo/ai/suggestions",
    "@/lib/workflows": "@repo/workflows",
    "@/lib/market": "@repo/market",
    "@/lib/appraisal": "@repo/appraisal",
    "@/lib/finance": "@repo/finance",
    "@/lib/compliance": "@repo/compliance",
  };

  if (process.env.LECIPM_CODEMOD_COMPONENTS === "1") {
    replaceMap["@/components"] = "@repo/ui/components";
  }

  const entries = Object.entries(replaceMap).sort((a, b) => b[0].length - a[0].length);

  function rewriteModuleSource(sourceNode) {
    if (!sourceNode || sourceNode.type !== "StringLiteral" && sourceNode.type !== "Literal") return;
    const v = sourceNode.value;
    if (typeof v !== "string") return;
    for (const [from, to] of entries) {
      if (v === from) {
        sourceNode.value = to;
        return;
      }
      if (v.startsWith(`${from}/`)) {
        sourceNode.value = `${to}${v.slice(from.length)}`;
        return;
      }
    }
  }

  root.find(j.ImportDeclaration).forEach((path) => {
    rewriteModuleSource(path.node.source);
  });

  root.find(j.ExportNamedDeclaration).forEach((path) => {
    if (path.node.source) rewriteModuleSource(path.node.source);
  });

  root.find(j.ExportAllDeclaration).forEach((path) => {
    rewriteModuleSource(path.node.source);
  });

  return root.toSource({ quote: "double" });
};
