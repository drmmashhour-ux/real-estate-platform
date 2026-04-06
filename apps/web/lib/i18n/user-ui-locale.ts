import { prisma } from "@/lib/db";
import type { LocaleCode } from "@/lib/i18n/locales";
import { normalizeLocaleCode } from "@/lib/i18n/server-translate";

/** Resolves UI language for server-side copy (AI, notifications, emails). */
export async function getUserUiLocaleCode(userId: string): Promise<LocaleCode> {
  const row = await prisma.user.findUnique({
    where: { id: userId },
    select: { preferredUiLocale: true },
  });
  return normalizeLocaleCode(row?.preferredUiLocale);
}
