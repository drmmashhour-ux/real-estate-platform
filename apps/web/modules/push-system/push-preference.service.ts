import { prisma } from "@/lib/db";
import type { BrokerPushPreferences } from "./push.types";
import { defaultPushPreferences } from "./push-template.service";

export async function getBrokerPushPreferences(userId: string): Promise<BrokerPushPreferences> {
  const row = await prisma.brokerMobilePreferences.findUnique({
    where: { userId },
    select: { pushCategorySettings: true, privacyMinimizeLockScreen: true },
  });
  const raw = (row?.pushCategorySettings as Record<string, boolean> | null) ?? {};
  return {
    categories: { ...defaultPushPreferences().categories, ...raw },
    privacyMinimizeLockScreen: row?.privacyMinimizeLockScreen ?? false,
  };
}

export async function upsertBrokerPushPreferences(
  userId: string,
  patch: Partial<{ categories: BrokerPushPreferences["categories"]; privacyMinimizeLockScreen: boolean }>
): Promise<BrokerPushPreferences> {
  const prev = await getBrokerPushPreferences(userId);
  const nextCats = { ...prev.categories, ...patch.categories };
  const nextPriv = patch.privacyMinimizeLockScreen ?? prev.privacyMinimizeLockScreen;
  await prisma.brokerMobilePreferences.upsert({
    where: { userId },
    create: {
      userId,
      pushCategorySettings: nextCats as object,
      privacyMinimizeLockScreen: nextPriv,
    },
    update: {
      pushCategorySettings: nextCats as object,
      privacyMinimizeLockScreen: nextPriv,
    },
  });
  return { categories: nextCats, privacyMinimizeLockScreen: nextPriv };
}
