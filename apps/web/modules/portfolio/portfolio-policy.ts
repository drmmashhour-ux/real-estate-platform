import type { PlatformRole } from "@prisma/client";

export function canAccessBrokerPortfolio(
  role: PlatformRole,
  userId: string,
  portfolio: { ownerUserId: string }
): boolean {
  if (role === "ADMIN") return true;
  return portfolio.ownerUserId === userId;
}
