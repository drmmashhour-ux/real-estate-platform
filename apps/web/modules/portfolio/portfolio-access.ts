import type { PlatformRole } from "@prisma/client";

/** Who may create/manage broker portfolios (Portfolio OS). */
export function canManagePortfolio(role: PlatformRole): boolean {
  return role === "BROKER" || role === "ADMIN" || role === "INVESTOR";
}

export async function loadPortfolioAssetContext(assetId: string) {
  // Placeholder to fix build error
  return { id: assetId };
}

export async function listAccessibleAssetIds(userId: string) {
  // Placeholder to fix build error
  return [];
}
