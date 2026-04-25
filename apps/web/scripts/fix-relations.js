/**
 * Prisma split-schema: remove field lines that reference model types not defined
 * in the same file (cross-domain "dangling" relations). Scalars and enums are safe.
 * Same-file model relations and @relation are kept.
 *
 * Usage (from apps/web):
 *   node scripts/fix-relations.js
 *   node scripts/fix-relations.js --all
 */
const fs = require("node:fs");
const path = require("node:path");

const webRoot = path.join(__dirname, "..");
const allFlag = process.argv.includes("--all");

const schemas = [
  path.join(webRoot, "prisma/core/schema.prisma"),
  path.join(webRoot, "prisma/marketplace/schema.prisma"),
  path.join(webRoot, "prisma/compliance/schema.prisma"),
  ...(allFlag ? [path.join(webRoot, "prisma/analytics/schema.prisma")] : []),
];

const SCALAR_TYPES = new Set([
  "String",
  "Int",
  "BigInt",
  "Float",
  "Boolean",
  "DateTime",
  "Json",
  "Decimal",
  "Bytes",
  "Unsupported",
]);

function collectModelAndEnumNames(text) {
  const models = new Set();
  const enums = new Set();
  for (const m of text.matchAll(/^model\s+(\w+)\s*\{/gm)) {
    models.add(m[1]);
  }
  for (const m of text.matchAll(/^enum\s+(\w+)\s*\{/gm)) {
    enums.add(m[1]);
  }
  return { models, enums };
}

function fieldLineBaseType(line) {
  const s = line.trim();
  if (!s) {
    return null;
  }
  if (s.startsWith("@@") || s.startsWith("///") || s.startsWith("//") || s.startsWith("#")) {
    return null;
  }
  const m = s.match(
    /^(\w+)\s+((?:Unsupported\([^)]*\)|[A-Z][A-Za-z0-9_]*))(\?)?(\s*\[[^\]]*])?(\s+|$)/,
  );
  if (!m) {
    return null;
  }
  const base = m[2];
  if (base.startsWith("Unsupported(")) {
    return "Unsupported";
  }
  return base;
}

function shouldRemoveFieldLine(line, models, enums) {
  const base = fieldLineBaseType(line);
  if (base === null) {
    return false;
  }
  if (SCALAR_TYPES.has(base) || base === "Unsupported") {
    return false;
  }
  if (enums.has(base)) {
    return false;
  }
  if (models.has(base)) {
    return false;
  }
  return true;
}

function processModelBlockContent(innerLines, models, enums) {
  return innerLines.filter((ln) => {
    const t = ln.trim();
    if (t.startsWith("@@") || t.startsWith("///") || t.startsWith("//")) {
      return true;
    }
    if (!fieldLineBaseType(ln)) {
      return true;
    }
    return !shouldRemoveFieldLine(ln, models, enums);
  });
}

/**
 * @param {string} content
 */
function fixFile(content) {
  const { models, enums } = collectModelAndEnumNames(content);
  const lines = content.split("\n");
  const out = [];
  let i = 0;
  while (i < lines.length) {
    const m = lines[i].match(/^model\s+\w+\s*\{\s*$/);
    if (!m) {
      out.push(lines[i]);
      i++;
      continue;
    }
    const first = lines[i];
    i++;
    const inner = [];
    let depth = 1;
    while (i < lines.length && depth > 0) {
      const L = lines[i];
      for (const ch of L) {
        if (ch === "{") {
          depth++;
        }
        if (ch === "}") {
          depth--;
        }
      }
      inner.push(L);
      i++;
    }
    const last = inner[inner.length - 1];
    const body = inner.slice(0, -1);
    out.push(first, ...processModelBlockContent(body, models, enums), last);
  }
  return out.join("\n");
}

function main() {
  for (const file of schemas) {
    if (!fs.existsSync(file)) {
      process.stderr.write(`skip (missing): ${path.relative(webRoot, file)}\n`);
      continue;
    }
    const rel = path.relative(webRoot, file);
    const before = fs.readFileSync(file, "utf-8");
    const after = fixFile(before);
    if (after === before) {
      process.stdout.write(`· ${rel} (no changes)\n`);
      continue;
    }
    fs.writeFileSync(file, after, "utf-8");
    process.stdout.write(`✔ ${rel}\n`);
  }
  process.stdout.write(
    "\nNext: pnpm exec prisma validate --schema=./prisma/core/schema.prisma  (and marketplace, compliance…)\n",
  );
}

main();
