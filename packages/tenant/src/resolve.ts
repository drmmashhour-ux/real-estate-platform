import { TenantStatus } from "@prisma/client";

import { prisma } from "@repo/db";

/**
 * Resolve workspace tenant from Host header: custom domain, then subdomain label.
 * Skips bare localhost / single-label hosts so local dev falls through to platform.
 */
export async function resolveTenantFromHost(host: string) {
  const clean = host.split(":")[0]?.toLowerCase() ?? "";

  const byDomain = await prisma.tenant.findFirst({
    where: {
      primaryDomain: clean,
      status: { not: TenantStatus.ARCHIVED },
    },
    include: { brand: true },
  });

  if (byDomain) return byDomain;

  const parts = clean.split(".").filter(Boolean);

  let sub: string | null = null;
  if (parts.length >= 3) {
    sub = parts[0];
  } else if (parts.length === 2 && parts[1] === "localhost") {
    sub = parts[0];
  }

  if (!sub || sub === "www") {
    return null;
  }

  return prisma.tenant.findFirst({
    where: {
      subdomain: sub,
      status: { not: TenantStatus.ARCHIVED },
    },
    include: { brand: true },
  });
}

export type ResolvedTenant = NonNullable<Awaited<ReturnType<typeof resolveTenantFromHost>>>;
