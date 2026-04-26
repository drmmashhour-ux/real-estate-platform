import { NextRequest, NextResponse } from "next/server";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();
import { requireSessionUser } from "@/modules/tenancy/services/tenant-api-helpers";
import { slugifyTenantName } from "@/modules/tenancy/utils/slug";

export const dynamic = "force-dynamic";

/** GET /api/tenants — workspaces the current user belongs to. */
export async function GET(request: NextRequest) {
  const user = await requireSessionUser(request);
  if (user instanceof NextResponse) return user;

  const memberships = await prisma.tenantMembership.findMany({
    where: { userId: user.id, status: { in: ["ACTIVE", "INVITED"] } },
    include: { tenant: true },
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json({
    tenants: memberships.map((m) => ({
      membershipId: m.id,
      role: m.role,
      status: m.status,
      tenant: {
        id: m.tenant.id,
        name: m.tenant.name,
        slug: m.tenant.slug,
        status: m.tenant.status,
        ownerUserId: m.tenant.ownerUserId,
        createdAt: m.tenant.createdAt.toISOString(),
      },
    })),
  });
}

/** POST /api/tenants — create workspace + owner membership. */
export async function POST(request: NextRequest) {
  const user = await requireSessionUser(request);
  if (user instanceof NextResponse) return user;

  const body = await request.json().catch(() => null);
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  if (!name) {
    return NextResponse.json({ error: "name required" }, { status: 400 });
  }

  let slug = typeof body?.slug === "string" && body.slug.trim() ? slugifyTenantName(body.slug) : slugifyTenantName(name);
  for (let i = 0; i < 8; i++) {
    const taken = await prisma.tenant.findUnique({ where: { slug }, select: { id: true } });
    if (!taken) break;
    slug = `${slugifyTenantName(name)}-${Math.random().toString(36).slice(2, 8)}`;
  }

  const tenant = await prisma.tenant.create({
    data: {
      name,
      slug,
      ownerUserId: user.id,
      settings: typeof body?.settings === "object" && body.settings ? body.settings : undefined,
      memberships: {
        create: {
          userId: user.id,
          role: "TENANT_OWNER",
          status: "ACTIVE",
        },
      },
    },
  });

  return NextResponse.json({
    tenant: {
      id: tenant.id,
      name: tenant.name,
      slug: tenant.slug,
      status: tenant.status,
    },
  });
}
