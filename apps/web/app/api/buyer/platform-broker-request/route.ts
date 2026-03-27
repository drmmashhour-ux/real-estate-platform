import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { checkRateLimit, getRateLimitHeaders } from "@/lib/rate-limit";
import { isFsboPubliclyVisible } from "@/lib/fsbo/constants";
import { getGuestId } from "@/lib/auth/session";
import { getDefaultTenantId } from "@/lib/buyer/tenant-context";
import { pickNextPlatformBrokerId } from "@/lib/buyer/assign-platform-broker";
import { recordBuyerGrowthEvent } from "@/lib/buyer/buyer-analytics";
import { assertBuyerContactAllowed } from "@/modules/legal/assert-legal";
import { legalEnforcementDisabled } from "@/modules/legal/legal-enforcement";
import { NotificationType } from "@prisma/client";
import { requireContentLicenseAccepted } from "@/lib/legal/content-license-enforcement";

export const dynamic = "force-dynamic";

type Body = {
  fsboListingId: string;
  budgetMinCents?: number | null;
  budgetMaxCents?: number | null;
  timeline?: string | null;
  preferences?: string | null;
  buyerName: string;
  buyerEmail: string;
  buyerPhone?: string | null;
};

function parseBody(raw: unknown): { ok: true; data: Body } | { ok: false; error: string } {
  if (!raw || typeof raw !== "object") return { ok: false, error: "Invalid JSON" };
  const o = raw as Record<string, unknown>;
  const fsboListingId = typeof o.fsboListingId === "string" ? o.fsboListingId.trim() : "";
  const buyerName = typeof o.buyerName === "string" ? o.buyerName.trim().slice(0, 200) : "";
  const buyerEmail = typeof o.buyerEmail === "string" ? o.buyerEmail.trim().slice(0, 320) : "";
  const buyerPhone =
    typeof o.buyerPhone === "string" && o.buyerPhone.trim() ? o.buyerPhone.trim().slice(0, 40) : null;
  const timeline = typeof o.timeline === "string" ? o.timeline.trim().slice(0, 8000) : null;
  const preferences = typeof o.preferences === "string" ? o.preferences.trim().slice(0, 8000) : null;
  let budgetMinCents: number | null = null;
  let budgetMaxCents: number | null = null;
  if (typeof o.budgetMinCents === "number" && Number.isFinite(o.budgetMinCents)) {
    budgetMinCents = Math.max(0, Math.round(o.budgetMinCents));
  }
  if (typeof o.budgetMaxCents === "number" && Number.isFinite(o.budgetMaxCents)) {
    budgetMaxCents = Math.max(0, Math.round(o.budgetMaxCents));
  }
  if (!fsboListingId) return { ok: false, error: "fsboListingId required" };
  if (!buyerName) return { ok: false, error: "Name required" };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(buyerEmail)) return { ok: false, error: "Valid email required" };
  return {
    ok: true,
    data: {
      fsboListingId,
      buyerName,
      buyerEmail,
      buyerPhone,
      budgetMinCents,
      budgetMaxCents,
      timeline,
      preferences,
    },
  };
}

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const limit = checkRateLimit(`buyer:platform-broker:${ip}`, { windowMs: 60_000, max: 8 });
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Too many requests" },
      { status: 429, headers: getRateLimitHeaders(limit) }
    );
  }

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = parseBody(raw);
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });

  const listing = await prisma.fsboListing.findUnique({
    where: { id: parsed.data.fsboListingId },
  });
  if (!listing || !isFsboPubliclyVisible(listing)) {
    return NextResponse.json({ error: "Listing not available" }, { status: 404 });
  }

  const brokerId = await pickNextPlatformBrokerId();
  if (!brokerId) {
    return NextResponse.json(
      { error: "No broker available yet. Please use contact seller or try again later." },
      { status: 503 }
    );
  }

  const tenantId = await getDefaultTenantId();
  const userId = await getGuestId();

  if (!legalEnforcementDisabled()) {
    if (!userId) {
      return NextResponse.json(
        {
          error:
            "Sign in required for a platform broker request. Complete the buyer acknowledgment after signing in.",
          code: "LEGAL_SIGN_IN_REQUIRED",
        },
        { status: 401 }
      );
    }
    const licenseBlock = await requireContentLicenseAccepted(userId);
    if (licenseBlock) return licenseBlock;
    const legal = await assertBuyerContactAllowed(userId, parsed.data.fsboListingId);
    if (!legal.ok) {
      return NextResponse.json(
        {
          error: legal.blockingReasons[0] ?? "Complete required legal acknowledgments.",
          code: "LEGAL_FORMS_REQUIRED",
          missing: legal.missing.map((m) => m.key),
        },
        { status: 403 }
      );
    }
  }

  const notes = [
    `Platform broker request (listing ${listing.id})`,
    parsed.data.budgetMinCents != null || parsed.data.budgetMaxCents != null
      ? `Budget (cents): ${parsed.data.budgetMinCents ?? "—"} – ${parsed.data.budgetMaxCents ?? "—"}`
      : null,
    parsed.data.timeline ? `Timeline: ${parsed.data.timeline}` : null,
    parsed.data.preferences ? `Preferences: ${parsed.data.preferences}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  const brokerClient = await prisma.brokerClient.create({
    data: {
      brokerId,
      tenantId,
      userId: userId ?? undefined,
      fullName: parsed.data.buyerName,
      email: parsed.data.buyerEmail,
      phone: parsed.data.buyerPhone ?? undefined,
      source: "PLATFORM_BROKER",
      targetCity: listing.city,
      notes,
      budgetMin: parsed.data.budgetMinCents != null ? parsed.data.budgetMinCents / 100 : undefined,
      budgetMax: parsed.data.budgetMaxCents != null ? parsed.data.budgetMaxCents / 100 : undefined,
    },
  });

  const buyerRequest = await prisma.buyerRequest.create({
    data: {
      tenantId,
      userId: userId ?? undefined,
      buyerEmail: parsed.data.buyerEmail,
      buyerName: parsed.data.buyerName,
      buyerPhone: parsed.data.buyerPhone,
      fsboListingId: listing.id,
      budgetMinCents: parsed.data.budgetMinCents,
      budgetMaxCents: parsed.data.budgetMaxCents,
      timeline: parsed.data.timeline,
      preferences: parsed.data.preferences,
      leadSource: "PLATFORM_BROKER",
      assignedBrokerId: brokerId,
      brokerClientId: brokerClient.id,
      commissionEligible: true,
      dealOriginTag: "PLATFORM_MANAGED",
    },
  });

  let conversationId: string | null = null;
  if (userId) {
    const conv = await prisma.conversation.create({
      data: {
        tenantId: tenantId ?? undefined,
        brokerClientId: brokerClient.id,
        createdById: userId,
        subject: `Platform broker · ${listing.title.slice(0, 120)}`,
        participants: {
          create: [{ userId: brokerId }, { userId }],
        },
      },
    });
    conversationId = conv.id;
    await prisma.buyerRequest.update({
      where: { id: buyerRequest.id },
      data: { conversationId },
    });
  }

  void recordBuyerGrowthEvent("REQUEST_PLATFORM_BROKER", listing.id, {
    buyerRequestId: buyerRequest.id,
    brokerId,
    brokerClientId: brokerClient.id,
  });

  try {
    await prisma.notification.create({
      data: {
        userId: brokerId,
        type: NotificationType.CRM,
        title: "New platform buyer request",
        message: `${parsed.data.buyerName} requested help on “${listing.title.slice(0, 60)}”.`,
        actionUrl: `/dashboard/broker/clients/${brokerClient.id}`,
        actionLabel: "Open client",
        conversationId: conversationId ?? undefined,
        metadata: {
          buyerRequestId: buyerRequest.id,
          fsboListingId: listing.id,
        } as object,
        tenantId: tenantId ?? undefined,
      },
    });
  } catch {
    /* optional */
  }

  return NextResponse.json({
    ok: true,
    buyerRequestId: buyerRequest.id,
    brokerClientId: brokerClient.id,
    assignedBrokerId: brokerId,
    conversationId,
  });
}
