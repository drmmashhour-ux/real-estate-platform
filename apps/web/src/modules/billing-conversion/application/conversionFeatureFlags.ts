import { prisma } from "@/lib/db";

/** True when entitlements are seeded (migration applied). */
export async function isConversionBillingActive(): Promise<boolean> {
  try {
    const c = await prisma.lecipmConversionEntitlement.count();
    return c > 0;
  } catch {
    return false;
  }
}
