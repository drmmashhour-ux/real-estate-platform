import { NextRequest, NextResponse } from "next/server";
import type { OfferStatus } from "@prisma/client";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@repo/db";
import { isBrokerLikeRole } from "@/modules/offers/services/offer-access";
import { maskEmail } from "@/modules/offers/services/mask-email";
import { resolveListingTitle } from "@/modules/offers/services/resolve-listing-title";

const STATUS_FILTER = new Set<OfferStatus>([
  "SUBMITTED",
  "UNDER_REVIEW",
  "COUNTERED",
  "ACCEPTED",
  "REJECTED",
  "WITHDRAWN",
  "EXPIRED",
]);

export const dynamic = "force-dynamic";

/** GET /api/broker/offers — broker/admin inbox (non-draft). */
export async function GET(request: NextRequest) {
  const userId = await getGuestId();
  if (!userId) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  if (!user || !isBrokerLikeRole(user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const statusFilter = searchParams.get("status");
  const sort = searchParams.get("sort") ?? "newest";

  const statusClause =
    statusFilter && statusFilter !== "all" && STATUS_FILTER.has(statusFilter as OfferStatus)
      ? { status: statusFilter as OfferStatus }
      : { status: { not: "DRAFT" as OfferStatus } };

  const where =
    user.role === "ADMIN"
      ? { ...statusClause }
      : {
          ...statusClause,
          OR: [{ brokerId: null }, { brokerId: userId }],
        };

  const orderBy =
    sort === "price_desc"
      ? ({ offeredPrice: "desc" } as const)
      : sort === "price_asc"
        ? ({ offeredPrice: "asc" } as const)
        : ({ createdAt: "desc" } as const);

  const offers = await prisma.offer.findMany({
    where,
    orderBy,
    take: 200,
    include: {
      buyer: { select: { name: true, email: true } },
    },
  });

  const titleCache = new Map<string, Promise<string | null>>();
  const listingTitleOf = (listingId: string) => {
    if (!titleCache.has(listingId)) titleCache.set(listingId, resolveListingTitle(listingId));
    return titleCache.get(listingId)!;
  };

  const withTitles = await Promise.all(
    offers.map(async (o) => {
      const listingTitle = await listingTitleOf(o.listingId);
      return {
        id: o.id,
        listingId: o.listingId,
        listingTitle,
        status: o.status,
        offeredPrice: o.offeredPrice,
        downPaymentAmount: o.downPaymentAmount,
        financingNeeded: o.financingNeeded,
        closingDate: o.closingDate?.toISOString() ?? null,
        message: o.message,
        createdAt: o.createdAt.toISOString(),
        updatedAt: o.updatedAt.toISOString(),
        buyer: {
          name: o.buyer?.name ?? null,
          email: maskEmail(o.buyer?.email),
        },
      };
    })
  );

  return NextResponse.json({ ok: true, offers: withTitles });
}
