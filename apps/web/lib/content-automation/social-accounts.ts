import { prisma } from "@/lib/db";
import { encryptGrowthSecret, decryptGrowthSecret, isGrowthTokenVaultConfigured } from "@/lib/crypto/growthTokenVault";
import { isTokenNearingExpiry } from "@/lib/integrations/meta/refresh-token";

export type SafeSocialAccount = {
  id: string;
  platform: string;
  accountName: string | null;
  accountId: string | null;
  expiresAt: Date | null;
  lastSyncAt: Date | null;
  tokenValid: boolean | null;
  metadataJson: Record<string, unknown>;
};

export async function listSocialAccountsSafe(userId: string): Promise<SafeSocialAccount[]> {
  const rows = await prisma.socialAccount.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
  });
  return rows.map((r) => ({
    id: r.id,
    platform: r.platform,
    accountName: r.accountName,
    accountId: r.accountId,
    expiresAt: r.expiresAt,
    lastSyncAt: r.lastSyncAt,
    tokenValid: inferTokenValidity(r.expiresAt),
    metadataJson: (r.metadataJson as Record<string, unknown>) ?? {},
  }));
}

function inferTokenValidity(expiresAt: Date | null): boolean | null {
  if (!expiresAt) return null;
  return !isTokenNearingExpiry(expiresAt, 86_400_000);
}

export async function getSocialAccountForUser(accountId: string, userId: string) {
  return prisma.socialAccount.findFirst({
    where: { id: accountId, userId },
  });
}

export type StoredTokenPair = {
  accessToken: string;
  refreshToken?: string | null;
  expiresAt?: Date | null;
};

export function encryptTokens(pair: StoredTokenPair): {
  accessTokenEncrypted: string | null;
  refreshTokenEncrypted: string | null;
  expiresAt: Date | null;
} {
  if (!isGrowthTokenVaultConfigured()) {
    throw new Error("GROWTH_TOKEN_ENCRYPTION_KEY not configured; cannot store social tokens");
  }
  return {
    accessTokenEncrypted: encryptGrowthSecret(pair.accessToken),
    refreshTokenEncrypted: pair.refreshToken ? encryptGrowthSecret(pair.refreshToken) : null,
    expiresAt: pair.expiresAt ?? null,
  };
}

export function decryptAccessToken(row: { accessTokenEncrypted: string | null }): string | null {
  if (!row.accessTokenEncrypted) return null;
  try {
    return decryptGrowthSecret(row.accessTokenEncrypted);
  } catch {
    return null;
  }
}

export async function getInstagramCredentialsForUser(userId: string): Promise<{
  accessToken: string;
  igUserId: string;
  socialAccountId: string;
} | null> {
  const row =
    (await prisma.socialAccount.findFirst({
      where: { userId, platform: "instagram" },
      orderBy: { updatedAt: "desc" },
    })) ??
    (await prisma.socialAccount.findFirst({
      where: { userId, platform: "meta" },
      orderBy: { updatedAt: "desc" },
    }));

  if (!row?.accessTokenEncrypted) return null;
  const token = decryptAccessToken(row);
  if (!token) return null;
  const meta = (row.metadataJson as Record<string, unknown>) ?? {};
  const igUserId = typeof meta.igUserId === "string" ? meta.igUserId : null;
  if (!igUserId) return null;
  return { accessToken: token, igUserId, socialAccountId: row.id };
}

export async function getFacebookPageCredentialsForUser(userId: string): Promise<{
  pageAccessToken: string;
  pageId: string;
  socialAccountId: string;
} | null> {
  const row = await prisma.socialAccount.findFirst({
    where: { userId, platform: "facebook" },
    orderBy: { updatedAt: "desc" },
  });
  if (!row?.accessTokenEncrypted) return null;
  const token = decryptAccessToken(row);
  if (!token) return null;
  const pageId = row.accountId;
  if (!pageId) return null;
  return { pageAccessToken: token, pageId, socialAccountId: row.id };
}
