import type { InsuranceLeadType } from "@prisma/client";
import { prisma } from "@/lib/db";

/**
 * Pick an active partner. Respects optional `preferredLeadTypes` JSON array (e.g. ["TRAVEL"]).
 * Falls back to first active partner if no match.
 */
export async function assignInsurancePartner(leadType: InsuranceLeadType): Promise<string | null> {
  const partners = await prisma.insurancePartner.findMany({
    where: { isActive: true },
    orderBy: { createdAt: "asc" },
    select: { id: true, preferredLeadTypes: true },
  });
  if (partners.length === 0) return null;

  const matchesType = (raw: unknown): boolean => {
    if (raw == null) return true;
    if (!Array.isArray(raw)) return true;
    if (raw.length === 0) return true;
    return raw.map(String).includes(leadType);
  };

  for (const p of partners) {
    if (matchesType(p.preferredLeadTypes)) return p.id;
  }
  return partners[0]?.id ?? null;
}
