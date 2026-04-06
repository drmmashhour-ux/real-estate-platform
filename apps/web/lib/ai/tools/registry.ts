import { prisma } from "@/lib/db";
import { isPlatformAdmin } from "@/lib/auth/is-platform-admin";
import { getBookingsForHost } from "@/lib/bnhub/booking";
import { listingToPropertyMemory } from "../memory/property-memory";
import { logManagerAction } from "../logger";

export type ToolResult<T> = { ok: true; data: T } | { ok: false; error: string };

export async function toolGetCurrentUserContext(userId: string): Promise<
  ToolResult<{
    id: string;
    role: string;
    email: string | null;
    stripeOnboardingComplete: boolean | null;
    stripeAccountId: string | null;
    shortTermListingCount: number;
  }>
> {
  const u = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      role: true,
      email: true,
      stripeOnboardingComplete: true,
      stripeAccountId: true,
      _count: { select: { shortTermListings: true } },
    },
  });
  if (!u) return { ok: false, error: "user_not_found" };
  return {
    ok: true,
    data: {
      id: u.id,
      role: u.role,
      email: u.email,
      stripeOnboardingComplete: u.stripeOnboardingComplete,
      stripeAccountId: u.stripeAccountId,
      shortTermListingCount: u._count.shortTermListings,
    },
  };
}

export async function toolGetListingById(userId: string, listingId: string): Promise<ToolResult<ReturnType<typeof listingToPropertyMemory> & { listingStatus: string }>> {
  const row = await prisma.shortTermListing.findFirst({
    where: {
      id: listingId,
      ownerId: userId,
    },
    select: {
      id: true,
      title: true,
      city: true,
      nightPriceCents: true,
      instantBookEnabled: true,
      description: true,
      maxGuests: true,
      listingStatus: true,
      ownerId: true,
    },
  });
  if (!row) {
    if (await isPlatformAdmin(userId)) {
      const adminRow = await prisma.shortTermListing.findUnique({
        where: { id: listingId },
        select: {
          id: true,
          title: true,
          city: true,
          nightPriceCents: true,
          instantBookEnabled: true,
          description: true,
          maxGuests: true,
          listingStatus: true,
          ownerId: true,
        },
      });
      if (!adminRow) return { ok: false, error: "listing_not_found" };
      return {
        ok: true,
        data: { ...listingToPropertyMemory(adminRow), listingStatus: adminRow.listingStatus },
      };
    }
    return { ok: false, error: "forbidden_or_missing" };
  }
  return { ok: true, data: { ...listingToPropertyMemory(row), listingStatus: row.listingStatus } };
}

export async function toolGetListingsForHost(userId: string): Promise<ToolResult<{ id: string; title: string; city: string; status: string }[]>> {
  const rows = await prisma.shortTermListing.findMany({
    where: { ownerId: userId },
    select: { id: true, title: true, city: true, listingStatus: true },
    orderBy: { updatedAt: "desc" },
    take: 40,
  });
  return {
    ok: true,
    data: rows.map((r) => ({ id: r.id, title: r.title, city: r.city, status: r.listingStatus })),
  };
}

export async function toolGetBookingById(userId: string, bookingId: string): Promise<
  ToolResult<{
    id: string;
    status: string;
    checkIn: string;
    checkOut: string;
    nights: number;
    guestId: string;
    listingId: string;
    listingTitle: string;
    paymentStatus: string | null;
  }>
> {
  const b = await prisma.booking.findUnique({
    where: { id: bookingId },
    select: {
      id: true,
      status: true,
      checkIn: true,
      checkOut: true,
      nights: true,
      guestId: true,
      listingId: true,
      listing: { select: { title: true, ownerId: true } },
      payment: { select: { status: true } },
    },
  });
  if (!b) return { ok: false, error: "booking_not_found" };
  const hostId = b.listing.ownerId;
  const allowed = b.guestId === userId || hostId === userId || (await isPlatformAdmin(userId));
  if (!allowed) return { ok: false, error: "forbidden" };
  return {
    ok: true,
    data: {
      id: b.id,
      status: b.status,
      checkIn: b.checkIn.toISOString(),
      checkOut: b.checkOut.toISOString(),
      nights: b.nights,
      guestId: b.guestId,
      listingId: b.listingId,
      listingTitle: b.listing.title,
      paymentStatus: b.payment?.status ?? null,
    },
  };
}

export async function toolGetBookingsForHost(userId: string): Promise<ToolResult<{ id: string; status: string; checkIn: string; listingTitle: string }[]>> {
  const rows = await getBookingsForHost(userId);
  return {
    ok: true,
    data: rows.slice(0, 30).map((b) => ({
      id: b.id,
      status: b.status,
      checkIn: b.checkIn.toISOString(),
      listingTitle: b.listing?.title ?? "",
    })),
  };
}

export async function toolGetBookingsForGuest(userId: string): Promise<ToolResult<{ id: string; status: string; checkIn: string; listingTitle: string }[]>> {
  const rows = await prisma.booking.findMany({
    where: { guestId: userId },
    orderBy: { checkIn: "desc" },
    take: 30,
    select: {
      id: true,
      status: true,
      checkIn: true,
      listing: { select: { title: true } },
    },
  });
  return {
    ok: true,
    data: rows.map((b) => ({
      id: b.id,
      status: b.status,
      checkIn: b.checkIn.toISOString(),
      listingTitle: b.listing.title,
    })),
  };
}

export async function toolGetPaymentStatus(userId: string, bookingId: string): Promise<ToolResult<{ status: string | null; amountCents: number | null }>> {
  const b = await prisma.booking.findUnique({
    where: { id: bookingId },
    select: {
      guestId: true,
      listing: { select: { ownerId: true } },
      payment: { select: { status: true, amountCents: true } },
    },
  });
  if (!b) return { ok: false, error: "booking_not_found" };
  const allowed = b.guestId === userId || b.listing.ownerId === userId || (await isPlatformAdmin(userId));
  if (!allowed) return { ok: false, error: "forbidden" };
  return {
    ok: true,
    data: {
      status: b.payment?.status ?? null,
      amountCents: b.payment?.amountCents ?? null,
    },
  };
}

export async function toolGetPayoutStatus(userId: string): Promise<
  ToolResult<{
    stripeOnboardingComplete: boolean | null;
    stripeAccountId: string | null;
  }>
> {
  const u = await prisma.user.findUnique({
    where: { id: userId },
    select: { stripeOnboardingComplete: true, stripeAccountId: true, role: true },
  });
  if (!u) return { ok: false, error: "user_not_found" };
  return {
    ok: true,
    data: {
      stripeOnboardingComplete: u.stripeOnboardingComplete,
      stripeAccountId: u.stripeAccountId,
    },
  };
}

/** Real counts only — no fabricated KPIs. */
export async function toolGetAdminMetrics(viewerId: string): Promise<
  ToolResult<{
    bookingsLast24h: number;
    pendingBookings: number;
    activeStrListings: number;
    openDisputes: number;
  }>
> {
  if (!(await isPlatformAdmin(viewerId))) return { ok: false, error: "forbidden" };
  const since = new Date(Date.now() - 864e5);
  const [bookingsLast24h, pendingBookings, activeStrListings, openDisputes] = await Promise.all([
    prisma.booking.count({ where: { createdAt: { gte: since } } }),
    prisma.booking.count({
      where: { status: { in: ["PENDING", "AWAITING_HOST_APPROVAL"] } },
    }),
    prisma.shortTermListing.count({
      where: { listingStatus: { in: ["PUBLISHED", "APPROVED"] } },
    }),
    prisma.dispute.count({
      where: {
        status: {
          in: [
            "OPEN",
            "SUBMITTED",
            "UNDER_REVIEW",
            "WAITING_FOR_HOST_RESPONSE",
            "EVIDENCE_REVIEW",
            "ESCALATED",
          ],
        },
      },
    }),
  ]);
  return {
    ok: true,
    data: { bookingsLast24h, pendingBookings, activeStrListings, openDisputes },
  };
}

export async function toolSearchInternalKnowledgeDocs(query: string): Promise<ToolResult<{ snippets: string[] }>> {
  const q = query.slice(0, 200).toLowerCase();
  const snippets: string[] = [];
  if (/cancel|refund/i.test(q)) snippets.push("Cancellation rules follow the listing cancellation policy and booking status.");
  if (/check.?in|checkout/i.test(q)) snippets.push("Check-in/out times are on the listing; hosts may share details in booking messages.");
  if (/payout|stripe/i.test(q)) snippets.push("Host payouts require a completed Stripe Connect onboarding when enabled for the account.");
  return { ok: true, data: { snippets } };
}

export async function toolCreateNotification(userId: string, title: string, body: string): Promise<ToolResult<{ id: string }>> {
  await prisma.managerAiNotificationLog.create({
    data: {
      userId,
      channel: "in_app",
      type: "ai_suggestion",
      payload: { title, body } as object,
      status: "queued",
    },
  });
  return { ok: true, data: { id: "queued" } };
}

export async function toolCreateEmailDraft(_userId: string, _subject: string, _body: string): Promise<ToolResult<{ draftId: string }>> {
  return { ok: true, data: { draftId: `draft_${Date.now()}` } };
}

export async function toolCreateInAppTask(userId: string, label: string): Promise<ToolResult<{ ok: boolean }>> {
  await prisma.managerAiNotificationLog.create({
    data: {
      userId,
      channel: "task",
      type: "ai_task",
      payload: { label } as object,
      status: "queued",
    },
  });
  return { ok: true, data: { ok: true } };
}

export async function toolCreatePromotionSuggestion(userId: string, listingId: string, note: string): Promise<ToolResult<{ recommendationId: string }>> {
  const rec = await prisma.managerAiRecommendation.create({
    data: {
      userId,
      agentKey: "revenue",
      title: "Promotion idea",
      description: note,
      confidence: 0.55,
      targetEntityType: "short_term_listing",
      targetEntityId: listingId,
      suggestedAction: "review_promotion",
      status: "active",
      payload: { source: "tool" } as object,
    },
  });
  return { ok: true, data: { recommendationId: rec.id } };
}

/** Safe fields only; live price/title changes require approval elsewhere. */
export async function toolUpdateSafeListingFields(
  userId: string,
  listingId: string,
  patch: { subtitle?: string | null; neighborhoodDetails?: string | null }
): Promise<ToolResult<{ updated: boolean }>> {
  const listing = await prisma.shortTermListing.findFirst({
    where: { id: listingId, ownerId: userId },
    select: { id: true },
  });
  if (!listing) return { ok: false, error: "forbidden_or_missing" };
  await prisma.shortTermListing.update({
    where: { id: listingId },
    data: {
      ...(patch.subtitle !== undefined ? { subtitle: patch.subtitle } : {}),
      ...(patch.neighborhoodDetails !== undefined ? { neighborhoodDetails: patch.neighborhoodDetails } : {}),
    },
  });
  await logManagerAction({
    userId,
    actionKey: "update_safe_listing_fields",
    targetEntityType: "short_term_listing",
    targetEntityId: listingId,
    status: "executed",
    payload: patch as Record<string, unknown>,
  });
  return { ok: true, data: { updated: true } };
}

export async function toolMarkBookingNeedsReview(adminUserId: string, bookingId: string, reason: string): Promise<ToolResult<{ ok: boolean }>> {
  if (!(await isPlatformAdmin(adminUserId))) return { ok: false, error: "forbidden" };
  await prisma.managerAiRecommendation.create({
    data: {
      userId: adminUserId,
      agentKey: "trust_safety",
      title: "Booking needs review",
      description: reason,
      confidence: 0.7,
      targetEntityType: "booking",
      targetEntityId: bookingId,
      suggestedAction: "admin_review",
      status: "active",
    },
  });
  return { ok: true, data: { ok: true } };
}

export async function toolCreateSupportSummary(userId: string, bookingId: string, summary: string): Promise<ToolResult<{ id: string }>> {
  const rec = await prisma.managerAiRecommendation.create({
    data: {
      userId,
      agentKey: "guest_support",
      title: "Support summary",
      description: summary,
      confidence: 0.65,
      targetEntityType: "booking",
      targetEntityId: bookingId,
      suggestedAction: "support_summary",
      status: "active",
    },
  });
  return { ok: true, data: { id: rec.id } };
}

export async function toolLogAiAction(userId: string | null, payload: Record<string, unknown>): Promise<ToolResult<{ logged: boolean }>> {
  await logManagerAction({
    userId,
    actionKey: String(payload.actionKey ?? "tool_log"),
    targetEntityType: String(payload.targetEntityType ?? "platform"),
    targetEntityId: String(payload.targetEntityId ?? "na"),
    status: String(payload.status ?? "logged"),
    payload,
  });
  return { ok: true, data: { logged: true } };
}
