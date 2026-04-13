/**
 * Persistent IP denylist (fingerprinted). Checked on auth and rate-limited public routes.
 */
import { prisma } from "@/lib/db";
import { recordPlatformEvent } from "@/lib/observability";
import { fingerprintClientIp } from "@/lib/security/ip-fingerprint";

export function parseIpOrFingerprint(input: string): string {
  const t = input.trim();
  if (/^[a-f0-9]{24}$/i.test(t)) return t.toLowerCase();
  return fingerprintClientIp(t);
}

export async function isSecurityIpBlocked(ipFingerprint: string): Promise<boolean> {
  const row = await prisma.securityIpBlock.findUnique({
    where: { ipFingerprint },
  });
  if (!row) return false;
  if (row.expiresAt && row.expiresAt.getTime() <= Date.now()) {
    await prisma.securityIpBlock.delete({ where: { id: row.id } }).catch(() => {});
    return false;
  }
  return true;
}

export async function blockSecurityIp(params: {
  ipFingerprint: string;
  reason: string;
  /** Hours until expiry; omit for 7d default */
  hours?: number;
  createdByUserId?: string | null;
}): Promise<{ id: string }> {
  const hours = params.hours ?? 24 * 7;
  const expiresAt = new Date(Date.now() + hours * 60 * 60 * 1000);
  const row = await prisma.securityIpBlock.upsert({
    where: { ipFingerprint: params.ipFingerprint },
    create: {
      ipFingerprint: params.ipFingerprint,
      reason: params.reason.slice(0, 500),
      expiresAt,
      createdByUserId: params.createdByUserId ?? undefined,
    },
    update: {
      reason: params.reason.slice(0, 500),
      expiresAt,
      createdByUserId: params.createdByUserId ?? undefined,
    },
  });
  void recordPlatformEvent({
    eventType: "security_ip_blocked",
    sourceModule: "security",
    entityType: "IP_BLOCK",
    entityId: params.ipFingerprint,
    payload: { reason: params.reason, hours },
  }).catch(() => {});
  return { id: row.id };
}

export async function unblockSecurityIp(ipFingerprint: string): Promise<boolean> {
  try {
    await prisma.securityIpBlock.delete({ where: { ipFingerprint } });
    void recordPlatformEvent({
      eventType: "security_ip_unblocked",
      sourceModule: "security",
      entityType: "IP_BLOCK",
      entityId: ipFingerprint,
      payload: {},
    }).catch(() => {});
    return true;
  } catch {
    return false;
  }
}

export async function listSecurityIpBlocks(limit = 50) {
  return prisma.securityIpBlock.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}
