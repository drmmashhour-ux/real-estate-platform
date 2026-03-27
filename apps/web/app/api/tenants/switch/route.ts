import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { setTenantContextCookie } from "@/lib/auth/session";
import { requireSessionUser } from "@/modules/tenancy/services/tenant-api-helpers";
import { getUserTenantMembership } from "@/modules/tenancy/services/tenant-context-service";

export const dynamic = "force-dynamic";

/** POST /api/tenants/switch — set current workspace cookie (httpOnly). */
export async function POST(request: NextRequest) {
  const user = await requireSessionUser(request);
  if (user instanceof NextResponse) return user;

  const body = await request.json().catch(() => null);
  const tenantId = typeof body?.tenantId === "string" ? body.tenantId.trim() : null;
  if (!tenantId) {
    return NextResponse.json({ error: "tenantId required" }, { status: 400 });
  }

  const tenant = await prisma.tenant.findFirst({
    where: { id: tenantId, status: "ACTIVE" },
    select: { id: true },
  });
  if (!tenant) {
    return NextResponse.json({ error: "workspace not found" }, { status: 404 });
  }

  if (user.role !== "ADMIN") {
    const m = await getUserTenantMembership(user.id, tenantId);
    if (!m) {
      return NextResponse.json({ error: "not a member of this workspace" }, { status: 403 });
    }
  }

  const res = NextResponse.json({ ok: true, tenantId });
  const c = setTenantContextCookie(tenantId);
  res.cookies.set(c.name, c.value, {
    path: c.path,
    maxAge: c.maxAge,
    httpOnly: c.httpOnly,
    secure: c.secure,
    sameSite: c.sameSite,
  });
  return res;
}
