/**
 * One-time / dev: upsert placeholder OACIQ section row (replace with counsel-approved JSON after guideline paste).
 *
 * Usage (from apps/web):
 *   pnpm exec tsx scripts/seed-oaciq-pending-compliance-section.ts
 */
import { pendingAiBehaviorPlaceholder, pendingRuleEnginePlaceholder, pendingSectionTitles, PENDING_SECTION_KEY } from "@/lib/compliance/oaciq/pending-section-placeholder";
import { prisma } from "@/lib/db";

async function main() {
  const titles = pendingSectionTitles();
  await prisma.oaciqComplianceSection.upsert({
    where: { sectionKey: PENDING_SECTION_KEY },
    create: {
      sectionKey: PENDING_SECTION_KEY,
      sectionTitleFr: titles.sectionTitleFr,
      sectionTitleEn: titles.sectionTitleEn,
      sourceExcerpt: null,
      ruleEngineJson: pendingRuleEnginePlaceholder(),
      aiBehaviorJson: pendingAiBehaviorPlaceholder(),
      clauseFr: titles.clauseFr,
      clauseEn: titles.clauseEn,
      defaultRiskLevel: "MEDIUM",
      active: true,
    },
    update: {
      sectionTitleFr: titles.sectionTitleFr,
      sectionTitleEn: titles.sectionTitleEn,
      ruleEngineJson: pendingRuleEnginePlaceholder(),
      aiBehaviorJson: pendingAiBehaviorPlaceholder(),
      clauseFr: titles.clauseFr,
      clauseEn: titles.clauseEn,
    },
  });
  console.log("Upserted OaciqComplianceSection:", PENDING_SECTION_KEY);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
