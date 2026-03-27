import type { GrowthMarketingChannelStatus, GrowthMarketingPlatform } from "@prisma/client";
import { isGrowthTokenVaultConfigured } from "@/lib/crypto/growthTokenVault";
import { upsertMarketingChannel } from "@/src/modules/growth-automation/infrastructure/growthAutomationRepository";

export type ConnectChannelInput = {
  platform: GrowthMarketingPlatform;
  externalAccountId: string;
  displayName: string;
  accessToken: string;
  refreshToken?: string | null;
  scopes: string[];
  tokenExpiresAt?: string | null;
  status?: GrowthMarketingChannelStatus;
};

export async function connectChannel(input: ConnectChannelInput) {
  if (!isGrowthTokenVaultConfigured()) {
    throw new Error("Token vault not configured (set GROWTH_TOKEN_ENCRYPTION_KEY or GROWTH_TOKEN_ENCRYPTION_SECRET)");
  }
  const tokenExpiresAt = input.tokenExpiresAt ? new Date(input.tokenExpiresAt) : null;
  return upsertMarketingChannel({
    platform: input.platform,
    externalAccountId: input.externalAccountId,
    displayName: input.displayName,
    accessTokenPlain: input.accessToken,
    refreshTokenPlain: input.refreshToken ?? null,
    scopes: input.scopes,
    tokenExpiresAt,
    status: input.status ?? "CONNECTED",
  });
}
