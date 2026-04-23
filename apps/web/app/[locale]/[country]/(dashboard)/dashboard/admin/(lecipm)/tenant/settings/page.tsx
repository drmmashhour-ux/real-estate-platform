import { TenantMembershipStatus, TenantRole } from "@prisma/client";

import TenantBrandSettingsClient from "@/components/tenant/TenantBrandSettingsClient";
import { requireAuthenticatedUser } from "@/lib/auth/require-session";
import { prisma } from "@repo/db";

export const dynamic = "force-dynamic";

export default async function TenantBrandSettingsPage() {
  const { userId } = await requireAuthenticatedUser();

  const memberships = await prisma.tenantMembership.findMany({
    where: {
      userId,
      status: TenantMembershipStatus.ACTIVE,
      role: { in: [TenantRole.TENANT_OWNER, TenantRole.TENANT_ADMIN] },
    },
    include: {
      tenant: {
        include: {
          brand: true,
        },
      },
    },
  });

  const rows = memberships.map((m) => ({
    tenantId: m.tenant.id,
    tenantName: m.tenant.name,
    displayName: m.tenant.brand?.displayName ?? m.tenant.name,
    primaryColor: m.tenant.brand?.primaryColor ?? "#D4AF37",
    secondaryColor: m.tenant.brand?.secondaryColor ?? "#000000",
    accentColor: m.tenant.brand?.accentColor ?? "#ffffff",
    heroTitle: m.tenant.brand?.heroTitle ?? "",
    heroSubtitle: m.tenant.brand?.heroSubtitle ?? "",
  }));

  return (
    <div className="min-h-screen bg-black">
      <TenantBrandSettingsClient tenants={rows} />
    </div>
  );
}
