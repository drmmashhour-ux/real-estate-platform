import { prisma } from "@/lib/db";
import { isMultiCityOperationsEnabled } from "@/src/modules/cities/cityEnv";
import { normalizeCityKey } from "@/src/modules/cities/cityNormalizer";
import type { RankingSearchContext } from "@/src/modules/ranking/types";

/**
 * When multi-city mode is on, attach `rankingConfigKey` from the active city profile for this search.
 */
export async function augmentRankingSearchContextWithCityProfile(
  ctx: RankingSearchContext
): Promise<RankingSearchContext> {
  if (!isMultiCityOperationsEnabled()) return ctx;
  const raw = ctx.city?.trim();
  if (!raw) return ctx;
  const nk = normalizeCityKey(raw);
  try {
    const profile = await prisma.cityOperationProfile.findFirst({
      where: {
        isActive: true,
        OR: [{ cityKey: nk }, { cityName: { equals: raw, mode: "insensitive" } }],
      },
      select: { rankingConfigKey: true },
    });
    const key = profile?.rankingConfigKey?.trim();
    if (!key) return ctx;
    return { ...ctx, rankingConfigKey: key };
  } catch {
    return ctx;
  }
}
