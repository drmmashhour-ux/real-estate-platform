/**
 * One-time: upsert Revenu Québec profile from secure input (run locally; do not commit real account numbers).
 *
 *   cd apps/web && pnpm exec tsx scripts/seed-revenu-quebec-profile.ts
 */
import { config } from "dotenv";
import path from "node:path";
import { upsertRevenuQuebecProfile } from "../lib/financial/revenu-quebec-profile";

config({ path: path.resolve(process.cwd(), ".env") });
config({ path: path.resolve(process.cwd(), ".env.local"), override: true });

async function main() {
  await upsertRevenuQuebecProfile({
    ownerType: "solo_broker",
    ownerId: process.env.REVENU_QC_SEED_OWNER_ID ?? "REPLACE_WITH_REAL_OWNER_ID",
    legalName: "MOHAMED ALMASHHOUR",
    businessDirectorName: "MOHAMED ALMASHHOUR",
    gstAccountNumber: process.env.REVENU_QC_SEED_GST ?? "REPLACE_FROM_SECURE_SOURCE",
    qstFileNumber: process.env.REVENU_QC_SEED_QST ?? "REPLACE_FROM_SECURE_SOURCE",
    neq: process.env.REVENU_QC_SEED_NEQ ?? "REPLACE_IF_AVAILABLE",
    reportingFrequency: "annual",
    firstPeriodStart: new Date("2024-07-23"),
    firstPeriodEnd: new Date("2024-12-31"),
    firstReturnDueAt: new Date("2025-04-30"),
    sourceDocumentName: "Adobe Scan Apr 21, 2026.pdf",
    sourceDocumentStored: true,
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
