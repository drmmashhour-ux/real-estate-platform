/**
 * CURSOR ORDER — auto-fix dangling relations in standalone domain trees.
 *
 * After `pnpm run prisma:extract`, each of prisma/core|marketplace|compliance|analytics
 * is a *separate* Prisma project. Field types must refer only to models/enums *present
 * in that same domain folder* (across all shard files). This script removes field lines
 * that reference a model name not defined anywhere in the domain, or drops relation-only
 * lines when the referenced type is missing (keeps existing userId / listingId scalars).
 *
 * It does **not** do the dangerous global replace `Field + Model` → `fieldId String`
 * (that would corrupt enums like `role PlatformRole`).
 *
 * Prisma 7: validate with the folder: prisma validate --schema=./prisma/core
 *
 * Usage (from apps/web):
 *   node scripts/fix-relations.js
 *   node scripts/fix-relations.js --all
 */
const fs = require("node:fs");
const path = require("node:path");

const webRoot = path.join(__dirname, "..");
const allFlag = process.argv.includes("--all");

const DOMAIN_DIRS = [
  path.join(webRoot, "prisma", "core"),
  path.join(webRoot, "prisma", "marketplace"),
  path.join(webRoot, "prisma", "compliance"),
  ...(allFlag ? [path.join(webRoot, "prisma", "analytics")] : []),
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

function listPrismaFilesInDir(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".prisma"))
    .map((f) => path.join(dir, f));
}

function fieldLineBaseType(line) {
  const s = line.trim();
  if (!s) {
    return null;
  }
  if (s.startsWith("@@") || s.startsWith("///") || s.startsWith("//") || s.startsWith("**")) {
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

function shouldRemoveFieldLine(line, globalModels, globalEnums) {
  const base = fieldLineBaseType(line);
  if (base === null) {
    return false;
  }
  if (SCALAR_TYPES.has(base) || base === "Unsupported") {
    return false;
  }
  if (globalEnums.has(base)) {
    return false;
  }
  if (globalModels.has(base)) {
    return false;
  }
  return true;
}

function processModelBlockContent(innerLines, globalModels, globalEnums) {
  return innerLines.filter((ln) => {
    const t = ln.trim();
    if (t.startsWith("@@") || t.startsWith("///") || t.startsWith("//") || t.startsWith("**")) {
      return true;
    }
    if (!fieldLineBaseType(ln)) {
      return true;
    }
    return !shouldRemoveFieldLine(ln, globalModels, globalEnums);
  });
}

/**
 * @param {string} content
 * @param {Set<string>} globalModels
 * @param {Set<string>} globalEnums
 */
function fixFile(content, globalModels, globalEnums) {
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
    out.push(first, ...processModelBlockContent(body, globalModels, globalEnums), last);
  }
  return out.join("\n");
}

function main() {
  for (const domainDir of DOMAIN_DIRS) {
    const files = listPrismaFilesInDir(domainDir);
    if (files.length === 0) {
      process.stderr.write(`skip (no .prisma): ${path.relative(webRoot, domainDir)}\n`);
      continue;
    }
    const fullText = files.map((f) => fs.readFileSync(f, "utf-8")).join("\n\n");
    const { models, enums } = collectModelAndEnumNames(fullText);
    for (const file of files) {
      const rel = path.relative(webRoot, file);
      const before = fs.readFileSync(file, "utf-8");
      const after = fixFile(before, models, enums);
      if (after === before) {
        process.stdout.write(`· ${rel} (no changes)\n`);
        continue;
      }
      fs.writeFileSync(file, after, "utf-8");
      process.stdout.write(`✔ ${rel}\n`);
    }
  }
  process.stdout.write(
    "\nNext: pnpm exec prisma validate --schema=./prisma/core  (and marketplace, compliance…; use directory path for sharded schema)\n" +
      "      pnpm run prisma:generate:domain-clients-three   # or prisma:generate:split for all four\n",
  );
}

main();
