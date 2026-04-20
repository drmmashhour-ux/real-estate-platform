import { prisma } from "@/lib/db";

/** Stable key for `InvestorAccess.email` lookups (matches stored rows if admins seed lowercased). */
export function normalizeInvestorEmail(email: string): string {
  return email.trim().toLowerCase();
}

export async function getInvestorByEmail(email: string | null | undefined) {
  if (!email?.trim()) return null;
  return prisma.investorAccess.findUnique({
    where: { email: normalizeInvestorEmail(email) },
  });
}
