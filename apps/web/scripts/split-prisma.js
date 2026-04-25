/**
 * CURSOR ORDER — auto extract (production version; do not use the naive regex-split recipe)
 * -----------------------------------------------------------------------------
 * The one-file recipe that splits on `(?=model |enum )` and writes `url = env("DATABASE_URL")`
 * in the schema is unsafe here: fragile parsing, no cross-domain fixups, and Prisma ORM 7
 * forbids `url` in the schema file (URL lives in prisma.config.ts).
 *
 * This script instead:
 *   1) Source: `prisma/schema.full.prisma` if present, else merge of 00-enums + 10–40 partials.
 *   2) Domain: `prisma/model-domains.json` (from annotate-prisma-model-domains.mjs) + keyword fallback.
 *   3) Strips cross-bucket @relation and model[] back-refs; shards each domain to ≤ 5000 lines.
 *   4) Emits: prisma/core|marketplace|compliance|analytics/ with schema.prisma (header) + chunk files.
 *
 * Workflow
 *   pnpm run prisma:annotate-domains     # optional: refresh // @domain + model-domains.json
 *   pnpm run prisma:materialize-full     # optional: write schema.full.prisma from partials
 *   pnpm run prisma:extract
 *   pnpm run prisma:validate:domain-clients
 *   pnpm run prisma:generate:split       # or prisma:generate:domain-clients-three to skip analytics
 *
 * Prisma 7: datasource has no `url` here. Generate with: prisma generate --schema=./prisma/core
 * (use the folder path so all shard files merge).
 */
const fs = require("node:fs");
const path = require("node:path");

const webRoot = path.join(__dirname, "..");
const prismaDir = path.join(webRoot, "prisma");
const inputFull = path.join(prismaDir, "schema.full.prisma");
const domainMapPath = path.join(prismaDir, "model-domains.json");
const MAX_LINES = Number(process.env.PRISMA_STANDALONE_MAX_LINES || 5000) || 5000;

const PARTIALS = [
  "00-enums.prisma",
  "10-core.prisma",
  "20-marketplace.prisma",
  "30-compliance.prisma",
  "40-intelligence.prisma",
];

const rules = {
  core: [
    "User",
    "Account",
    "Session",
    "Role",
    "Permission",
    "Organization",
    "Team",
    "Auth",
  ],
  marketplace: [
    "Listing",
    "Property",
    "Unit",
    "Booking",
    "Reservation",
    "Calendar",
    "Payment",
    "Transaction",
    "Invoice",
    "Stripe",
    "Host",
    "Guest",
    "BNHub",
    "Bnhub",
  ],
  compliance: [
    "Declaration",
    "Seller",
    "Audit",
    "Log",
    "Verification",
    "Identity",
    "Document",
    "Consent",
    "OACIQ",
    "Oaciq",
    "Disclosure",
    "Risk",
    "Complaint",
    "Register",
  ],
  analytics: [
    "Score",
    "Graph",
    "Embedding",
    "AI",
    "Ai",
    "Prediction",
    "Insight",
    "Metric",
    "Event",
    "Tracking",
    "Experiment",
    "Simulation",
    "Analyzer",
  ],
};

const DOMAIN_KEYS = ["core", "marketplace", "compliance", "analytics"];

function readMergedSource() {
  if (fs.existsSync(inputFull)) {
    return fs.readFileSync(inputFull, "utf-8");
  }
  return PARTIALS.map((f) => {
    const p = path.join(prismaDir, f);
    if (!fs.existsSync(p)) {
      throw new Error(`Missing ${f}; restore partials or add prisma/schema.full.prisma`);
    }
    return fs.readFileSync(p, "utf-8");
  }).join("\n\n");
}

function stripDomainComments(text) {
  return text
    .split("\n")
    .filter((l) => !/^\s*\/\/\s*@domain:\s*/.test(l))
    .filter((l) => !/^\s*\/\/\s*@domain:\s*enums/.test(l))
    .join("\n");
}

function extractTopLevelBlocks(text) {
  const t = stripDomainComments(text);
  const lines = t.split("\n");
  const blocks = [];
  let i = 0;
  while (i < lines.length) {
    const m = lines[i].match(/^(model|enum)\s+(\w+)\s*\{\s*$/);
    if (m) {
      const type = m[1];
      const name = m[2];
      let depth = 0;
      let j = i;
      for (; j < lines.length; j++) {
        for (const ch of lines[j]) {
          if (ch === "{") depth++;
          if (ch === "}") depth--;
        }
        if (j > i && depth === 0) {
          const body = lines.slice(i, j + 1).join("\n");
          blocks.push({ type, name, text: body });
          i = j + 1;
          break;
        }
      }
      if (j >= lines.length) {
        throw new Error(`Unclosed block at line ${i + 1} (${type} ${name})`);
      }
      continue;
    }
    i++;
  }
  return blocks;
}

let cachedMap = null;
function loadDomainMap() {
  if (cachedMap) return cachedMap;
  try {
    cachedMap = JSON.parse(fs.readFileSync(domainMapPath, "utf-8"));
  } catch {
    cachedMap = null;
  }
  return cachedMap;
}

function keywordClassifyModelName(name) {
  const n = name;
  const order = ["core", "marketplace", "compliance", "analytics"];
  for (const domain of order) {
    for (const keyword of rules[domain]) {
      if (n.includes(keyword)) {
        if (domain === "analytics" && /^(User|Session|Listing|Property|Booking)\w*/.test(n)) {
          continue;
        }
        return domain;
      }
    }
  }
  return "analytics";
}

/**
 * @param {string} name
 * @param {"model"|"enum"} kind
 */
function resolveDomain(name, kind) {
  if (kind === "enum") {
    return "enums";
  }
  const map = loadDomainMap();
  if (map && map[name] && !String(map[name]).startsWith("enums:")) {
    const tag = map[name];
    if (tag === "intelligence" || tag === "analytics") return "analytics";
    if (["core", "marketplace", "compliance"].includes(tag)) return tag;
  }
  return keywordClassifyModelName(name);
}

const header = (outName) => `// Autogenerated by scripts/split-prisma.js — do not edit by hand; restore via pnpm run prisma:extract
generator client {
  provider   = "prisma-client-js"
  output     = ${JSON.stringify(`../generated/${outName}`)}
  engineType = "binary"
}

datasource db {
  provider = "postgresql"
}
`;

const scalars = new Set([
  "String",
  "Int",
  "Float",
  "Boolean",
  "DateTime",
  "Json",
  "Bytes",
  "Decimal",
  "BigInt",
  "Unsupported",
]);
/**
 * Remove relation fields that reference another Prisma model in a different domain bucket.
 */
function stripCrossDomainModel(
  modelText,
  _selfName,
  selfBucket,
  /** @type {Map<string,string>} */ modelNameToBucket,
  /** @type {Set<string>} */ modelNames,
  /** @type {Set<string>} */ enumNames
) {
  const lines = modelText.split("\n");
  if (lines.length < 2) return modelText;
  if (!/^model\s+\w+/.test(lines[0] || "")) return modelText;
  const out = [lines[0]];
  for (let i = 1; i < lines.length - 1; i++) {
    const line = lines[i];
    const t = line.trim();
    if (t === "" || t.startsWith("//") || t.startsWith("///") || t.startsWith("@@") || t.startsWith("**")) {
      out.push(line);
      continue;
    }
    const bucket = (n) => modelNameToBucket.get(n) || "analytics";
    const cross = (typeName) =>
      modelNames.has(typeName) &&
      !enumNames.has(typeName) &&
      !scalars.has(typeName) &&
      bucket(typeName) !== selfBucket;
    if (t.includes("@relation")) {
      const relArr = t.match(/^\s*(\w+)\s+([A-Z][A-Za-z0-9_]*)\[\]\s*(@relation[\s("'].*)$/);
      if (relArr) {
        if (cross(relArr[2])) continue;
        out.push(line);
        continue;
      }
      const relSc = t.match(/^\s*(\w+)\s+([A-Z][A-Za-z0-9_]*)\s*(\?)?\s*(@relation[\s("'].*)$/);
      if (relSc) {
        if (cross(relSc[2])) continue;
        out.push(line);
        continue;
      }
      out.push(line);
      continue;
    }
    const arr1 = t.match(/^\s*(\w+)\s+([A-Z][A-Za-z0-9_]*)\[\](\s+@.*)?$/);
    if (arr1) {
      if (cross(arr1[2])) continue;
      out.push(line);
      continue;
    }
    const optModel = t.match(/^\s*(\w+)\s+([A-Z][A-Za-z0-9_]*)\?\s*$/);
    if (optModel) {
      if (cross(optModel[2])) continue;
      out.push(line);
      continue;
    }
    out.push(line);
  }
  out.push(lines[lines.length - 1]);
  return out.join("\n");
}

/**
 * Pack string blocks (each a full top-level model or enum) into files ≤ maxLines.
 */
function packIntoFiles(blockStrings, maxLines) {
  const out = [];
  let cur = [];
  let lineCount = 0;
  for (const block of blockStrings) {
    const n = block.split("\n").length;
    if (n > maxLines) {
      if (cur.length) {
        out.push(cur.join("\n\n"));
        cur = [];
        lineCount = 0;
      }
      out.push(block);
      continue;
    }
    const sep = cur.length ? 2 : 0;
    if (lineCount + sep + n > maxLines && cur.length) {
      out.push(cur.join("\n\n"));
      cur = [];
      lineCount = 0;
    }
    if (lineCount) lineCount += 2;
    cur.push(block);
    lineCount += n;
  }
  if (cur.length) out.push(cur.join("\n\n"));
  return out;
}

function clearDomainPrismaFiles(outDir) {
  if (!fs.existsSync(outDir)) return;
  for (const name of fs.readdirSync(outDir)) {
    if (!name.endsWith(".prisma")) continue;
    fs.unlinkSync(path.join(outDir, name));
  }
}

function main() {
  const content = readMergedSource();
  const blocks = extractTopLevelBlocks(content);

  const modelNames = new Set();
  const enumNames = new Set();
  for (const b of blocks) {
    if (b.type === "model") modelNames.add(b.name);
    else enumNames.add(b.name);
  }

  const modelNameToBucket = new Map();
  for (const b of blocks) {
    if (b.type === "model") {
      modelNameToBucket.set(b.name, resolveDomain(b.name, "model"));
    }
  }

  const domains = {
    core: [],
    marketplace: [],
    compliance: [],
    analytics: [],
    enums: [],
  };

  for (const b of blocks) {
    if (b.type === "enum") {
      domains.enums.push(b.text.trim());
      continue;
    }
    const d = resolveDomain(b.name, "model");
    const bucket = d === "enums" ? "core" : d;
    let text = b.text.trim();
    text = stripCrossDomainModel(
      text,
      b.name,
      bucket,
      modelNameToBucket,
      modelNames,
      enumNames
    );
    domains[bucket].push(text);
  }

  const enumBlocks = domains.enums;
  for (const key of DOMAIN_KEYS) {
    const outDir = path.join(prismaDir, key);
    clearDomainPrismaFiles(outDir);
    fs.mkdirSync(outDir, { recursive: true });

    fs.writeFileSync(path.join(outDir, "schema.prisma"), header(key), "utf-8");

    const parts = [];
    const enumChunks = packIntoFiles(enumBlocks, MAX_LINES);
    enumChunks.forEach((c, i) => {
      parts.push({ name: `0-enum-chunk-${String(i + 1).padStart(2, "0")}.prisma`, body: c + "\n" });
    });

    const modelChunks = packIntoFiles(domains[key], MAX_LINES);
    modelChunks.forEach((c, i) => {
      parts.push({ name: `1-model-chunk-${String(i + 1).padStart(2, "0")}.prisma`, body: c + "\n" });
    });

    if (parts.length === 0) {
      fs.writeFileSync(
        path.join(outDir, "1-model-chunk-01.prisma"),
        "// (empty domain — no models)\n",
        "utf-8"
      );
    } else {
      for (const p of parts) {
        fs.writeFileSync(path.join(outDir, p.name), p.body, "utf-8");
      }
    }

    const nModels = domains[key].length;
    process.stdout.write(
      `✔ ${key}: ${nModels} models, ${enumBlocks.length} enums (sharded), → ${outDir}\n`
    );
  }

  process.stdout.write(
    `\nValidate:  pnpm exec prisma validate --schema=./prisma/core\n` +
      `Generate:  pnpm exec prisma generate --schema=./prisma/core\n` +
      `            (and marketplace, compliance, analytics)\n`
  );
}

main();
