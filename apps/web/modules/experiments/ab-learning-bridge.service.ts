import { prisma } from "@/lib/db";
import { recordBestCtaPhrase, recordHighPerformingHook, recordLosingHeadline } from "@/modules/ads/ads-learning-store";
import type { ExperimentOutcomeDecisionView } from "./ab-testing.types";

/** Optional cross-link to ads learning memory — recommendation-only. */
export async function recordOutcomeHintsToLearning(
  experimentId: string,
  view: ExperimentOutcomeDecisionView,
): Promise<void> {
  if (view.status !== "winner_found" || !view.winningVariantId) return;

  const v = await prisma.experimentVariant.findUnique({
    where: { id: view.winningVariantId },
    select: { configJson: true, variantKey: true },
  });
  if (!v) return;

  const cfg = v.configJson && typeof v.configJson === "object" ? (v.configJson as Record<string, unknown>) : {};
  const headline = typeof cfg.headline === "string" ? cfg.headline : null;
  const cta = typeof cfg.ctaText === "string" ? cfg.ctaText : null;
  if (headline) recordHighPerformingHook(`AB win ${experimentId}: ${headline.slice(0, 80)}`);
  if (cta) recordBestCtaPhrase(cta);
  for (const id of view.losingVariantIds ?? []) {
    const loser = await prisma.experimentVariant.findUnique({
      where: { id },
      select: { variantKey: true },
    });
    if (loser) recordLosingHeadline(`AB lose ${experimentId} · ${loser.variantKey}`);
  }
}
