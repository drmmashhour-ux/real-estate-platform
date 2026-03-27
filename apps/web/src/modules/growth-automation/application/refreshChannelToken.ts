import { decryptGrowthSecret } from "@/lib/crypto/growthTokenVault";
import {
  getMarketingChannelById,
  updateChannelTokens,
} from "@/src/modules/growth-automation/infrastructure/growthAutomationRepository";
import { refreshOAuthTokens } from "@/src/modules/growth-automation/infrastructure/oauthRefresh";

export async function refreshChannelToken(channelId: string) {
  const ch = await getMarketingChannelById(channelId);
  if (!ch) throw new Error("Channel not found");
  if (!ch.oauthRefreshTokenEncrypted) {
    throw new Error("No refresh token stored; reconnect the channel via OAuth");
  }
  const refreshPlain = decryptGrowthSecret(ch.oauthRefreshTokenEncrypted);
  const refreshed = await refreshOAuthTokens({
    platform: ch.platform,
    refreshToken: refreshPlain,
    externalAccountId: ch.externalAccountId,
  });
  if (!refreshed.ok) {
    throw new Error(refreshed.error);
  }
  return updateChannelTokens(channelId, {
    accessTokenPlain: refreshed.accessToken,
    refreshTokenPlain: refreshed.refreshToken ?? refreshPlain,
    tokenExpiresAt: refreshed.expiresAt ?? null,
    status: "CONNECTED",
  });
}
