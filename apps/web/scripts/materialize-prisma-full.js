#!/usr/bin/env node
/**
 * Writes apps/web/prisma/schema.full.prisma by concatenating the domain partials
 * (00-enums … 40-intelligence). That file is the optional single-file input for
 * scripts/split-prisma.js when present; otherwise the extract script merges partials directly.
 *
 *   node scripts/materialize-prisma-full.js
 *   pnpm run prisma:materialize-full
 */
const fs = require("node:fs");
const path = require("node:path");

const webRoot = path.join(__dirname, "..");
const prismaDir = path.join(webRoot, "prisma");
const PARTIALS = [
  "00-enums.prisma",
  "10-core.prisma",
  "20-marketplace.prisma",
  "30-compliance.prisma",
  "40-intelligence.prisma",
];
const outPath = path.join(prismaDir, "schema.full.prisma");

const chunks = PARTIALS.map((f) => {
  const p = path.join(prismaDir, f);
  if (!fs.existsSync(p)) {
    throw new Error(`Missing ${f} — cannot materialize schema.full.prisma`);
  }
  return fs.readFileSync(p, "utf-8");
});

const header = `// Materialized from ${PARTIALS.join(", ")} — regenerate: pnpm run prisma:materialize-full
// Used as input to scripts/split-prisma.js when you prefer a single file over on-disk partials.
`;

fs.writeFileSync(outPath, `${header}\n\n${chunks.join("\n\n")}\n`, "utf-8");
process.stdout.write(`Wrote ${path.relative(webRoot, outPath)}\n`);
