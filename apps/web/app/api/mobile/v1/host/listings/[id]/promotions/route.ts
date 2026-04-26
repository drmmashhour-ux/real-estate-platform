import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();
import { requireMobileUser, resolveMobileAppRoleFromRequest } from "@/lib/mobile/mobileAuth";

export const dynamic = "force-dynamic";

function parseDateOnly(s: unknown): Date | null {
  if (typeof s !== "string" || !s.trim()) return null;
  const d = new Date(s.trim().slice(0, 10) + "T12:00:00.000Z");
  return Number.isNaN(d.getTime()) ? null : d;
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireMobileUser(request);
    const appRole = await resolveMobileAppRoleFromRequest(request, user);
    if (appRole === "guest" && user.role !== "ADMIN") {
      return Response.json({ error: "Host access required" }, { status: 403 });
    }
    const { id: listingId } = await params;
    const listing = await prisma.shortTermListing.findFirst({
      where: { id: listingId, ownerId: user.id },
      select: { id: true },
    });
    if (!listing) return Response.json({ error: "Not found" }, { status: 404 });

    const promotions = await prisma.bnhubHostListingPromotion.findMany({
      where: { listingId },
      orderBy: { startDate: "desc" },
      take: 20,
    });

    return Response.json({
      promotions: promotions.map((p) => ({
        id: p.id,
        discountPercent: p.discountPercent,
        startDate: p.startDate.toISOString().slice(0, 10),
        endDate: p.endDate.toISOString().slice(0, 10),
        active: p.active,
        createdAt: p.createdAt.toISOString(),
      })),
    });
  } catch (e) {
    const err = e as Error & { status?: number };
    if (err.status === 401) return Response.json({ error: "Unauthorized" }, { status: 401 });
    throw e;
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireMobileUser(request);
    const appRole = await resolveMobileAppRoleFromRequest(request, user);
    if (appRole === "guest" && user.role !== "ADMIN") {
      return Response.json({ error: "Host access required" }, { status: 403 });
    }
    const { id: listingId } = await params;
    const listing = await prisma.shortTermListing.findFirst({
      where: { id: listingId, ownerId: user.id },
      select: { id: true },
    });
    if (!listing) return Response.json({ error: "Not found" }, { status: 404 });

    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const discountPercent =
      typeof body.discountPercent === "number" && Number.isFinite(body.discountPercent)
        ? Math.floor(body.discountPercent)
        : NaN;
    const startDate = parseDateOnly(body.startDate);
    const endDate = parseDateOnly(body.endDate);
    const active = body.active !== false;

    if (!Number.isFinite(discountPercent) || discountPercent < 1 || discountPercent > 90) {
      return Response.json({ error: "discountPercent must be 1–90" }, { status: 400 });
    }
    if (!startDate || !endDate || endDate < startDate) {
      return Response.json({ error: "startDate and endDate required (YYYY-MM-DD), end >= start" }, { status: 400 });
    }

    const created = await prisma.bnhubHostListingPromotion.create({
      data: {
        listingId,
        discountPercent,
        startDate,
        endDate,
        active,
      },
    });

    return Response.json({
      promotion: {
        id: created.id,
        discountPercent: created.discountPercent,
        startDate: created.startDate.toISOString().slice(0, 10),
        endDate: created.endDate.toISOString().slice(0, 10),
        active: created.active,
      },
    });
  } catch (e) {
    const err = e as Error & { status?: number };
    if (err.status === 401) return Response.json({ error: "Unauthorized" }, { status: 401 });
    throw e;
  }
}
