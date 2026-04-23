/**
 * Chunk PDFs → deterministic embeddings → `vector_documents` rows (OACIQ + brokerage books).
 *
 * Place PDFs under repo `docs/` (paths below). Missing files are skipped with a warning.
 *
 * Usage (from apps/web):
 *   pnpm exec tsx scripts/ingest-drafting-sources.ts
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { extractPdfText, splitIntoChunks } from "@/lib/ai/ingest-documents";
import { ingestVectorDocument } from "@/lib/ai/vector-ingest";
import { prisma } from "@/lib/db";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const WEB_ROOT = path.resolve(__dirname, "..");
const REPO_ROOT = path.resolve(WEB_ROOT, "..");

const FILES = [
  {
    filePath: path.join(REPO_ROOT, "docs", "221-201_Introduction to real estate book.pdf"),
    sourceKey: "real_estate_intro_book",
    title: "Introduction to Residential Real Estate Brokerage",
  },
  {
    filePath: path.join(REPO_ROOT, "docs", "promise-purchase-residential-immovable.pdf"),
    sourceKey: "oaciq_pp_residential",
    title: "Promise to Purchase - Residential Immovable",
  },
  {
    filePath: path.join(REPO_ROOT, "docs", "counter-proposal.pdf"),
    sourceKey: "oaciq_counter_proposal",
    title: "Counter-Proposal",
  },
  {
    filePath: path.join(REPO_ROOT, "docs", "annex-r-residential-immovable.pdf"),
    sourceKey: "oaciq_annex_r",
    title: "Annex R - Residential Immovable",
  },
  {
    filePath: path.join(REPO_ROOT, "docs", "notice-follow-up-fulfilment-conditions.pdf"),
    sourceKey: "oaciq_notice_conditions",
    title: "Notice and Follow-up on Fulfilment of Conditions",
  },
  {
    filePath: path.join(REPO_ROOT, "docs", "declarations-seller-divided-coownership.pdf"),
    sourceKey: "oaciq_other_forms",
    title: "Declarations by the Seller of the Immovable",
  },
  {
    filePath: path.join(REPO_ROOT, "docs", "drafting-book.pdf"),
    sourceKey: "drafting_book",
    title: "Drafting / clause standards book",
  },
];

async function ingestOne(filePath: string, sourceKey: string, title: string) {
  const text = await extractPdfText(filePath);
  const chunks = splitIntoChunks(text);
  let n = 0;
  for (const chunk of chunks) {
    if (!chunk.trim()) continue;
    await ingestVectorDocument({
      sourceKey,
      title,
      content: chunk,
      metadata: { title, sourceKey, chunkIndex: n },
    });
    n += 1;
  }
  console.info(`Ingested ${n} chunks — ${sourceKey} (${title})`);
}

async function main() {
  for (const file of FILES) {
    if (!fs.existsSync(file.filePath)) {
      console.warn(`Skip (missing): ${file.filePath}`);
      continue;
    }
    await ingestOne(file.filePath, file.sourceKey, file.title);
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
