import type { PlatformRole } from "@prisma/client";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@/lib/db";

export type BrokerCrmApiAuthResult =
  | { user: { id: string; role: PlatformRole }; error: null; status: null }
  | { user: null; error: "Unauthorized"; status: 401 }
  | { user: null; error: "Forbidden"; status: 403 };

export async function requireBrokerCrmApiUser(): Promise<BrokerCrmApiAuthResult> {
  const userId = await getGuestId();
  if (!userId) {
    return { user: null, error: "Unauthorized", status: 401 };
  }
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true },
  });
  if (!user || (user.role !== "BROKER" && user.role !== "ADMIN")) {
    return { user: null, error: "Forbidden", status: 403 };
  }
  return { user, error: null, status: null };
}
