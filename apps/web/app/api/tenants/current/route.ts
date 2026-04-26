import { NextRequest, NextResponse } from "next/server";
import { safeApiError } from "@/lib/api/safe-error-response";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();
import { createApiTimer } from "@/lib/middleware/request-logger";
import { requireSessionUser } from "@/modules/tenancy/services/tenant-api-helpers";
import { getRequestedTenantIdFromRequest } from "@/modules/tenancy/services/tenant-context-service";
import { assertTenantAccess } from "@/modules/tenancy/services/tenant-context-service";

export const dynamic = "force-dynamic";

/** GET /api/tenants/current — workspace from cookie / x-tenant-id (for header UI). */
export async function GET(request: NextRequest) {
  const timer = createApiTimer(request);
  try {
    const user = await requireSessionUser(request);
    if (user instanceof NextResponse) {
      timer.finish(user);
      return user;
    }

    const tenantId = getRequestedTenantIdFromRequest(request);
    if (!tenantId) {
      const res = NextResponse.json({ tenant: null });
      timer.finish(res, { userId: user.id });
      return res;
    }

    try {
      await assertTenantAccess(user.id, tenantId, user.role);
    } catch {
      const res = NextResponse.json({ tenant: null, invalid: true });
      timer.finish(res, { userId: user.id, tenantId });
      return res;
    }

    const tenant = await prisma.tenant.findFirst({
      where: { id: tenantId, status: "ACTIVE" },
      select: { id: true, name: true, slug: true, status: true },
    });

    if (!tenant) {
      const res = NextResponse.json({ tenant: null, invalid: true });
      timer.finish(res, { userId: user.id, tenantId });
      return res;
    }

    const res = NextResponse.json({ tenant });
    timer.finish(res, { userId: user.id, tenantId: tenant.id });
    return res;
  } catch (e) {
    const out = safeApiError(e, 500, {
      requestId: timer.requestId,
      context: "GET /api/tenants/current",
    });
    timer.finish(out);
    return out;
  }
}
