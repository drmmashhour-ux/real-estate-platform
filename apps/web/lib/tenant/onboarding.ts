import { TenantMembershipStatus, TenantRole, TenantStatus } from "@prisma/client";

import { prisma } from "@/lib/db";

import { TENANT_FEATURE_KEYS } from "./features";

const DEFAULT_ON_FEATURES = new Set(["ai_copilot", "market_watch", "alerts", "watchlist"]);

export async function createTenantWithDefaults(input: {
  name: string;
  slug: string;
  tenantType: string;
  ownerUserId: string;
  subdomain?: string | null;
}) {
  const tenant = await prisma.tenant.create({
    data: {
      name: input.name,
      slug: input.slug,
      tenantType: input.tenantType,
      status: TenantStatus.ACTIVE,
      subdomain: input.subdomain ?? null,
      ownerUserId: input.ownerUserId,
    },
  });

  await prisma.tenantBrand.create({
    data: {
      tenantId: tenant.id,
      displayName: input.name,
    },
  });

  await prisma.tenantMembership.create({
    data: {
      tenantId: tenant.id,
      userId: input.ownerUserId,
      role: TenantRole.TENANT_OWNER,
      status: TenantMembershipStatus.ACTIVE,
    },
  });

  await prisma.tenantFeatureFlag.createMany({
    data: TENANT_FEATURE_KEYS.map((featureKey) => ({
      tenantId: tenant.id,
      featureKey,
      enabled: DEFAULT_ON_FEATURES.has(featureKey),
    })),
    skipDuplicates: true,
  });

  logTenantAudit({
    action: "tenant_created",
    tenantId: tenant.id,
    actorUserId: input.ownerUserId,
    meta: { slug: input.slug, tenantType: input.tenantType },
  });

  return tenant;
}
