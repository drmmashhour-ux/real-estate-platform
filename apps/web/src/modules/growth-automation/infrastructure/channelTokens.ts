import type { GrowthMarketingPlatform } from "@prisma/client";
import { decryptGrowthSecret } from "@/lib/crypto/growthTokenVault";
import { getMarketingChannelById, updateChannelTokens } from "@/src/modules/growth-automation/infrastructure/growthAutomationRepository";
import { refreshOAuthTokens } from "@/src/modules/growth-automation/infrastructure/oauthRefresh";

export type DecryptedChannelTokens = {
  channelId: string;
  platform: GrowthMarketingPlatform;
  externalAccountId: string;
  accessToken: string;
  refreshToken: string | null;
};

export async function getDecryptedTokensForChannel(
  channelId: string,
): Promise<DecryptedChannelTokens | null> {
  const ch = await getMarketingChannelById(channelId);
  if (!ch) return null;
  return {
    channelId: ch.id,
    platform: ch.platform,
    externalAccountId: ch.externalAccountId,
    accessToken: decryptGrowthSecret(ch.oauthAccessTokenEncrypted),
    refreshToken: ch.oauthRefreshTokenEncrypted
      ? decryptGrowthSecret(ch.oauthRefreshTokenEncrypted)
      : null,
  };
}

/**
 * Refresh if token expires within `withinMs` (default 5 min).
 */
export async function ensureFreshAccessToken(
  channelId: string,
  withinMs = 5 * 60 * 1000,
): Promise<DecryptedChannelTokens | null> {
  const ch = await getMarketingChannelById(channelId);
  if (!ch) return null;
  const exp = ch.tokenExpiresAt?.getTime() ?? 0;
  const now = Date.now();
  if (exp && exp > now + withinMs) {
    return getDecryptedTokensForChannel(channelId);
  }
  const refreshed = await refreshOAuthTokens({
    platform: ch.platform,
    refreshToken: ch.oauthRefreshTokenEncrypted
      ? decryptGrowthSecret(ch.oauthRefreshTokenEncrypted)
      : null,
    externalAccountId: ch.externalAccountId,
  });
  if (!refreshed.ok) {
    return getDecryptedTokensForChannel(channelId);
  }
  await updateChannelTokens(channelId, {
    accessTokenPlain: refreshed.accessToken,
    refreshTokenPlain: refreshed.refreshToken ?? undefined,
    tokenExpiresAt: refreshed.expiresAt ?? null,
    status: "CONNECTED",
  });
  return getDecryptedTokensForChannel(channelId);
}
