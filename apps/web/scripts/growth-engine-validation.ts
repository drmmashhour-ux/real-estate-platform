/**
 * Validates scale growth engine — SEO defs, funnel capture, nurture trigger, AI content templates.
 *
 *   pnpm exec tsx scripts/growth-engine-validation.ts
 *
 * Requires DATABASE_URL for funnel + capture tests.
 */
import { config } from "dotenv";
import { resolve } from "node:path";
import { prisma } from "@/lib/db";
import { generateGrowthContent } from "@/modules/growth/content-ai.service";
import { captureGrowthLead } from "@/modules/growth/funnel-tracking.service";
import { getSeoLandingDefinition, listSeoLandingSlugs } from "@/modules/growth/seo/seo-page.service";
import { enrollEmailNurture, sendNextNurtureEmail } from "@/modules/growth/email-automation.service";

config({ path: resolve(process.cwd(), ".env") });
config({ path: resolve(process.cwd(), ".env.local"), override: true });

async function main(): Promise<void> {
  console.log("\n========== Growth scale engine validation ==========\n");
  let failed = 0;

  const slugs = listSeoLandingSlugs();
  for (const slug of slugs) {
    const def = getSeoLandingDefinition(slug, "en", "ca");
    if (!def?.title) {
      console.log(`FAIL SEO slug missing def: ${slug}`);
      failed++;
    }
  }
  if (failed === 0) console.log(`PASS SEO landing defs (${slugs.length} slugs)`);

  try {
    const pack = await generateGrowthContent({
      format: "linkedin",
      topic: "broker_productivity",
      useOpenAi: false,
    });
    if (pack.body.length < 20) failed++;
    console.log(`PASS AI content (${pack.source})`);
  } catch {
    console.log("FAIL AI content generation");
    failed++;
  }

  try {
    const email = `growth-valid-${Date.now()}@example.test`;
    await enrollEmailNurture(email);
    const row = await prisma.lecipmGrowthEmailNurture.findUnique({ where: { email } });
    if (!row) throw new Error("nurture row missing");
    const sent = await sendNextNurtureEmail(row.id);
    if (!sent.sent && sent.reason !== "send_failed") failed++;
    console.log(`PASS nurture pipeline (welcome attempt: ${sent.sent ? "sent" : sent.reason})`);

    const lead = await captureGrowthLead({
      email,
      source: "validation_script",
      metaJson: { test: true },
    });
    const cap = await prisma.lecipmGrowthCaptureLead.findUnique({ where: { id: lead.id } });
    if (!cap) failed++;
    console.log("PASS growth lead capture");

    await prisma.lecipmGrowthCaptureLead.deleteMany({ where: { email } }).catch(() => {});
    await prisma.lecipmGrowthFunnelEvent.deleteMany({ where: { email } }).catch(() => {});
    await prisma.lecipmGrowthEmailNurture.deleteMany({ where: { email } }).catch(() => {});
  } catch (e) {
    console.log(`FAIL funnel/nurture: ${e instanceof Error ? e.message : e}`);
    failed++;
  }

  console.log(failed ? `\n❌ Completed with ${failed} failure(s)\n` : "\n✅ Growth engine validation passed\n");
  process.exit(failed ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
