import { prisma } from "@/lib/db";

export type SnoozedActionRow = { id: string; until: string };

export async function loadBrokerMobileSnoozed(userId: string): Promise<SnoozedActionRow[]> {
  const row = await prisma.brokerMobilePreferences.findUnique({
    where: { userId },
    select: { snoozedActionsJson: true },
  });
  const raw = row?.snoozedActionsJson;
  if (!raw || !Array.isArray(raw)) return [];
  return raw.filter((r): r is SnoozedActionRow => {
    if (typeof r !== "object" || r === null || Array.isArray(r)) return false;
    const o = r as Record<string, unknown>;
    return typeof o.id === "string" && typeof o.until === "string";
  });
}
