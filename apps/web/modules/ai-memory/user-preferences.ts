import { prisma } from "@/lib/db";
import { logAiMemory } from "@/modules/ai-memory/ai-memory-logger";

export type DraftPersonalization = {
  localeHint?: string;
  detailLevel?: "concise" | "standard" | "verbose";
  clauseStrictness?: "balanced" | "strict";
};

export async function getDraftPersonalizationForUser(userId: string): Promise<DraftPersonalization> {
  const rows = await prisma.aiUserPreference.findMany({
    where: { userId },
  });
  const map = Object.fromEntries(rows.map((r) => [r.preferenceKey, r.value]));
  return {
    localeHint: map.ui_locale ?? map.language,
    detailLevel: map.draft_detail_level as DraftPersonalization["detailLevel"],
    clauseStrictness: map.clause_strictness as DraftPersonalization["clauseStrictness"],
  };
}

export function personalizationToPromptFragment(p: DraftPersonalization): string {
  const parts: string[] = [];
  if (p.localeHint) parts.push(`User language preference: ${p.localeHint}.`);
  if (p.detailLevel) parts.push(`Preferred detail level: ${p.detailLevel}.`);
  if (p.clauseStrictness) parts.push(`Clause strictness: ${p.clauseStrictness}.`);
  return parts.join(" ");
}

export async function upsertUserPreference(userId: string, preferenceKey: string, value: string): Promise<void> {
  await prisma.aiUserPreference.upsert({
    where: { userId_preferenceKey: { userId, preferenceKey } },
    create: { userId, preferenceKey, value },
    update: { value },
  });
  logAiMemory("ai_user_preference_applied", { userId, preferenceKey });
}
