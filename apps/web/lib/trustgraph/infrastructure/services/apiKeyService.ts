import { createHash, randomBytes } from "crypto";
import { prisma } from "@/lib/db";
import { getPhase8PlatformConfig } from "@/lib/trustgraph/config/phase8-platform";
import { isTrustGraphExternalApiEnabled, isTrustGraphEnabled } from "@/lib/trustgraph/feature-flags";

export function hashApiKey(secret: string): string {
  return createHash("sha256").update(secret, "utf8").digest("hex");
}

export function generateApiKeySecret(): string {
  return `tg_live_${randomBytes(24).toString("base64url")}`;
}

export async function createPartnerApiKey(args: {
  workspaceId: string;
  label?: string;
}): Promise<{ id: string; plainKey: string } | { skipped: true }> {
  if (!isTrustGraphEnabled() || !isTrustGraphExternalApiEnabled()) return { skipped: true };

  const plainKey = generateApiKeySecret();
  const keyHash = hashApiKey(plainKey);
  const cfg = getPhase8PlatformConfig();

  const row = await prisma.trustgraphPartnerApiKey.create({
    data: {
      workspaceId: args.workspaceId,
      keyHash,
      label: args.label ?? "default",
      rateLimitPerMinute: cfg.rateLimit.defaultPerMinute,
    },
    select: { id: true },
  });

  return { id: row.id, plainKey };
}

export async function verifyApiKey(plainKey: string): Promise<{
  workspaceId: string;
  rateLimitPerMinute: number;
  keyId: string;
} | null> {
  if (!isTrustGraphEnabled() || !isTrustGraphExternalApiEnabled()) return null;

  const keyHash = hashApiKey(plainKey);
  const row = await prisma.trustgraphPartnerApiKey.findFirst({
    where: { keyHash, revokedAt: null },
    select: { id: true, workspaceId: true, rateLimitPerMinute: true },
  });
  if (!row) return null;
  return { workspaceId: row.workspaceId, rateLimitPerMinute: row.rateLimitPerMinute, keyId: row.id };
}
