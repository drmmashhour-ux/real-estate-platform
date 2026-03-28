/**
 * Simulates monopoly-mode flows (expansion, competitor snapshot, network read).
 * Run: pnpm exec tsx scripts/validate-monopoly-mode.ts
 */
import { prisma } from "../lib/db";
import { launchCity } from "../src/modules/expansion/launchCity";
import { recordCompetitorSnapshot } from "../src/modules/competitor-tracking";
import { getNetworkEffectMetrics } from "../src/modules/network-effects";
import { getBrokerOnboardingSnapshot } from "../src/modules/supply";

async function main() {
  const launched = await launchCity("Sherbrooke");
  console.info("[monopoly] launchCity", launched);

  await recordCompetitorSnapshot({
    citySlug: "montreal",
    competitorKey: "simulated_ota_aggregate",
    competitorEstimate: 12000,
    avgPriceCentsTheirs: 18500,
    featureGaps: { instant_book: "parity", trust_badges: "ahead" },
    knownCitySlug: "montreal",
  }).catch((e) => console.warn("[monopoly] competitor snapshot skipped:", e));

  const net = await getNetworkEffectMetrics();
  console.info("[monopoly] network metrics", net);

  const anyUser = await prisma.user.findFirst({ select: { id: true } });
  if (anyUser) {
    const b = await getBrokerOnboardingSnapshot(anyUser.id);
    console.info("[monopoly] sample broker onboarding", b?.stage ?? "n/a");
  }

  console.info("LECIPM MONOPOLY MODE ACTIVE");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
