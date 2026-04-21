import { prisma } from "@/lib/db";
import { logInfo } from "@/lib/logger";

const TAG = "[asset-onboarding]";

/**
 * Idempotent module initialisation flags for the post-close managed asset.
 */
export async function bootstrapPostCloseAssetModule(
  postCloseAssetId: string,
  _options: { dealId: string; listingId: string | null },
): Promise<void> {
  const now = new Date().toISOString();
  const row = await prisma.postCloseAsset.findUnique({
    where: { id: postCloseAssetId },
    select: { onboardingMetadataJson: true },
  });
  const prev = (row?.onboardingMetadataJson as Record<string, unknown> | null) ?? {};

  await prisma.postCloseAsset.update({
    where: { id: postCloseAssetId },
    data: {
      operationsInitialized: true,
      revenueInitialized: true,
      onboardingMetadataJson: {
        ...prev,
        operationsInitAt: now,
        revenueInitAt: now,
        documentRegistry: "document storage path TBD — use internal document services per listing",
        compliance: "compliance queue — use listing compliance + ESG action center",
        investorReporting: "advisory — connect to existing reporting when enabled",
      } as object,
      updatedAt: new Date(),
    },
  });

  const healthExists = await prisma.portfolioAssetHealth.findUnique({
    where: { assetId: postCloseAssetId },
    select: { id: true },
  });
  if (!healthExists) {
    await prisma.portfolioAssetHealth.create({
      data: {
        assetId: postCloseAssetId,
        healthBand: "BASELINE",
        confidenceLevel: "INITIAL",
        summaryText:
          "Post-close onboarding baseline. Dimension scores populate as ESG, revenue, compliance, and operations data attach to this asset.",
        blockersJson: [],
        opportunitiesJson: [],
      },
    });
  }

  logInfo(`${TAG}`, { postCloseAssetId, bootstrapped: true });
}
