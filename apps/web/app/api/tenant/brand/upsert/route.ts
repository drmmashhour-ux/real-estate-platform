import { PlatformRole } from "@prisma/client";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { upsertTenantBrand } from "@/lib/tenant/branding";
import { logTenantAudit } from "@/lib/tenant/audit";
import { getTenantMembership, TENANT_BRAND_ROLES } from "@/lib/tenant/permissions";

export const dynamic = "force-dynamic";

type Body = {
  tenantId: string;
  displayName: string;
  logoUrl?: string | null;
  faviconUrl?: string | null;
  primaryColor?: string | null;
  secondaryColor?: string | null;
  accentColor?: string | null;
  heroTitle?: string | null;
  heroSubtitle?: string | null;
  customCss?: string | null;
  customSettings?: unknown;
};

export async function POST(req: Request) {
  const userId = await getGuestId();
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const tenantId = typeof body.tenantId === "string" ? body.tenantId.trim() : "";
  if (!tenantId || typeof body.displayName !== "string" || !body.displayName.trim()) {
    return Response.json({ error: "tenantId and displayName required" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });

  const isPlatformAdmin = user?.role === PlatformRole.ADMIN;

  if (!isPlatformAdmin) {
    const membership = await getTenantMembership(tenantId, userId);
    if (!membership || !TENANT_BRAND_ROLES.includes(membership.role)) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  const item = await upsertTenantBrand({
    tenantId,
    displayName: body.displayName.trim(),
    logoUrl: body.logoUrl,
    faviconUrl: body.faviconUrl,
    primaryColor: body.primaryColor,
    secondaryColor: body.secondaryColor,
    accentColor: body.accentColor,
    heroTitle: body.heroTitle,
    heroSubtitle: body.heroSubtitle,
    customCss: body.customCss,
    customSettings: body.customSettings,
  });

  logTenantAudit({
    action: "brand_updated",
    tenantId,
    actorUserId: userId,
    meta: { displayName: body.displayName },
  });

  return Response.json({ success: true, item });
}
