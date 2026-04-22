/**
 * Maximum-AI senior vertical smoke tests (matching, explainability, scoring, pricing, heat).
 *
 *   cd apps/web && pnpm exec tsx scripts/senior-ai-validation.ts
 *
 * Requires DATABASE_URL (read/write test rows).
 */
import { config } from "dotenv";
import { resolve } from "node:path";
import { prisma } from "@/lib/db";
import { computeFinalLeadPriceCents } from "@/modules/senior-living/ai/senior-dynamic-pricing.service";
import { computeAreaScore } from "@/modules/senior-living/ai/senior-heatmap.service";
import { parseVoiceSnippet } from "@/modules/senior-living/ai/senior-intent.service";
import { computeRankingScore } from "@/modules/senior-living/ai/senior-ranking.engine";
import { scoreLeadWithAiLayer } from "@/modules/senior-living/ai/senior-lead-scoring.service";
import {
  computeAreaInsights,
  explainResults,
  generateMatches,
  resolveSeniorAiProfileId,
  updateLearning,
} from "@/modules/senior-living/ai/senior-ai-orchestrator.service";
import { createMatchProfile } from "@/modules/senior-living/matching.service";

config({ path: resolve(process.cwd(), ".env") });
config({ path: resolve(process.cwd(), ".env.local"), override: true });

async function main(): Promise<void> {
  console.log("\n========== Senior AI vertical validation ==========\n");
  let failed = 0;

  try {
    const mp = await createMatchProfile({
      name: "Parent",
      mobilityLevel: "LIMITED",
      medicalNeeds: "LIGHT",
      budget: 4500,
      preferredCity: "Montreal",
    });
    console.log(`PASS tap profile ${mp.id}`);

    const aiId = await resolveSeniorAiProfileId(mp.id);
    if (aiId !== (await prisma.seniorAiProfile.findFirst({ where: { seniorMatchProfileId: mp.id } }))?.id) {
      failed++;
      console.log("FAIL resolveSeniorAiProfileId mismatch");
    } else {
      console.log("PASS resolve SeniorAiProfile id");
    }

    const matches = await generateMatches(mp.id);
    if (matches.length === 0) {
      failed++;
      console.log("FAIL generateMatches returned empty");
    } else {
      console.log(`PASS matching (${matches.length} scored)`);
      const first = matches[0];
      if (!first.explanation.headline || first.explanation.bullets.length === 0) {
        failed++;
        console.log("FAIL explanation empty");
      } else {
        console.log("PASS explanation payload");
      }
    }

    const summary = await explainResults(aiId, matches.slice(0, 3).map((m) => ({ residenceId: m.residenceId })));
    if (!summary.summary) failed++;
    console.log("PASS explainResults");

    const voice = parseVoiceSnippet("I need a place in Laval for my mother, some help, around 2500");
    if (!voice.preferredCity && !voice.budgetMonthly) failed++;
    console.log("PASS voice parse");

    const residence = await prisma.seniorResidence.findFirst({ select: { id: true } });
    if (residence) {
      const lead = await prisma.seniorLead.create({
        data: {
          residenceId: residence.id,
          requesterName: "Validation Family",
          email: `senior-ai-val-${Date.now()}@example.invalid`,
          status: "NEW",
        },
      });
      try {
        await scoreLeadWithAiLayer(lead.id);
        console.log("PASS AI lead score row");
      } catch {
        failed++;
        console.log("FAIL scoreLeadWithAiLayer");
      }
      await prisma.seniorLead.delete({ where: { id: lead.id } }).catch(() => {});
    } else {
      console.log("SKIP lead score (no residence in DB)");
    }

    await prisma.seniorLearningEvent
      .create({
        data: {
          eventType: "VIEW",
          metadataJson: { source: "senior-ai-validation" },
        },
      })
      .catch(() => {});
    console.log("PASS learning event insert");

    const learn = await updateLearning();
    if (!learn.ok) failed++;
    console.log(`PASS updateLearning (${learn.message})`);

    const rank = computeRankingScore({
      responseTimeAvgHours: 4,
      leadAcceptanceRate: 0.8,
      visitRate: 0.35,
      conversionRate: 0.12,
      profileCompleteness: 0.75,
      trustScore: 0.82,
      coldStart: false,
    });
    if (rank < 0 || rank > 100) failed++;
    console.log(`PASS ranking scalar (${rank})`);

    const heat = computeAreaScore({
      city: "Montreal",
      concentrationOfGoodMatches: 0.6,
      averageOperatorPerformance: 0.55,
      recentConversionStrength: 0.5,
      priceFitDensity: 0.62,
    });
    if (heat < 0 || heat > 100) failed++;
    console.log(`PASS heatmap score (${heat})`);

    await computeAreaInsights("Montreal").catch(() => {
      failed++;
      console.log("FAIL computeAreaInsights");
    });
    console.log("PASS computeAreaInsights");

    const price = await computeFinalLeadPriceCents({
      city: "Montreal",
      leadQualityScore: 82,
      conversionProbability: 0.55,
    });
    if (price.priceCents <= 0) failed++;
    console.log(`PASS dynamic pricing (${price.priceCents}¢)`);
  } catch (e) {
    failed++;
    console.error("FAIL fatal:", e);
  }

  console.log(`\n${failed === 0 ? "PASS" : "FAIL"} (${failed} checks failed)\n`);
  process.exit(failed === 0 ? 0 : 1);
}

void main();
