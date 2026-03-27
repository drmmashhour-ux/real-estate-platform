"use server";

import { getGuestId } from "@/lib/auth/session";
import { isPlatformAdmin } from "@/lib/auth/is-platform-admin";
import { refreshAllBnhubListingEngines } from "@/src/modules/bnhub-growth-engine/services/bnhubListingEnginesOrchestrator";
import { recomputeListingTrust } from "@/modules/bnhub-trust/services/listingRiskService";

export async function adminRecomputeBnhubEngines(listingId: string, _formData: FormData): Promise<void> {
  const userId = await getGuestId();
  if (!userId || !(await isPlatformAdmin(userId))) return;
  await refreshAllBnhubListingEngines(listingId);
  await recomputeListingTrust(listingId).catch(() => {});
}
