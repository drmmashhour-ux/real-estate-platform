import { TenantStatus } from "@prisma/client";

import { prisma } from "@/lib/db";

export type ResolvedTenant = NonNullable<Awaited<ReturnType<typeof resolveTenantFromHost>>>;

/**
 * Resolve white-label tenant from Host header (custom domain or subdomain).
 */
export async function resolveTenantFromHost(host: string) {
  const cleanHost = host.split(":")[0]?.toLowerCase() ?? "";

  const byDomain = await prisma.tenant.findFirst({
    where: { primaryDomain: cleanHost, status: { not: "ARCHIVED" } },
    include: { brand: true },
  });

  if (byDomain) return byDomain;

  const parts = cleanHost.split(".");
  const sub = parts.length > 2 ? parts[0] : null;

  if (sub && sub !== "www") {
    const bySubdomain = await prisma.tenant.findFirst({
      where: { subdomain: sub, status: { not: TenantStatus.ARCHIVED } },
      include: { brand: true },
    });

    if (bySubdomain) return bySubdomain;
  }

  return null;
}
