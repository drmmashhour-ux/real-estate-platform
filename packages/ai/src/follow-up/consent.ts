import { prisma } from "@/lib/db";
import { createHash } from "crypto";

export function hashIp(ip: string | null | undefined): string | null {
  if (!ip?.trim()) return null;
  return createHash("sha256").update(ip.trim()).digest("hex").slice(0, 32);
}

export async function recordLeadConsent(params: {
  leadId: string;
  consentSmsWhatsapp: boolean;
  consentVoice: boolean;
  locale?: string | null;
  sourcePage?: string | null;
  ip?: string | null;
  userAgent?: string | null;
}) {
  return prisma.leadContactConsent.create({
    data: {
      leadId: params.leadId,
      consentSmsWhatsapp: params.consentSmsWhatsapp,
      consentVoice: params.consentVoice,
      locale: params.locale?.slice(0, 8) ?? undefined,
      sourcePage: params.sourcePage?.slice(0, 500) ?? undefined,
      ipHash: hashIp(params.ip) ?? undefined,
      userAgent: params.userAgent?.slice(0, 500) ?? undefined,
    },
  });
}
