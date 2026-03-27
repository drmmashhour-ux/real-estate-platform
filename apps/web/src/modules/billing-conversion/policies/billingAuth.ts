import type { PlatformRole } from "@prisma/client";
import { isPlatformAdmin } from "@/lib/auth/is-platform-admin";

export async function isBillingAdmin(userId: string | null, role: PlatformRole): Promise<boolean> {
  if (role === "ADMIN") return true;
  if (!userId) return false;
  return isPlatformAdmin(userId);
}
