import type { Prisma } from "@prisma/client";

/** Snapshot stored in Contract.content for PDF + audit (lease_v1). */
export type LeaseContentV1 = {
  kind: "lease_v1";
  propertyAddress: string;
  city: string;
  region?: string | null;
  province: string;
  country: string;
  listingTitle: string;
  listingCode?: string | null;
  leaseStart: string;
  leaseEnd: string;
  rentAmountDisplay: string;
  rentCadence: string;
  paymentMethod: string;
  securityDepositDisplay: string;
  tenant: { name: string; email: string };
  landlord: { name: string; email: string };
  broker?: { name: string; email: string } | null;
  legalNotice: string;
};

export function parseLeaseContent(content: Prisma.JsonValue | null): LeaseContentV1 | null {
  if (!content || typeof content !== "object" || Array.isArray(content)) return null;
  const o = content as Record<string, unknown>;
  if (o.kind !== "lease_v1") return null;
  return content as unknown as LeaseContentV1;
}
