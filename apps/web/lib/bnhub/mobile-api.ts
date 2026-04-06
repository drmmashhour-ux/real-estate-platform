import type { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getCookieValueFromHeader, AUTH_SESSION_COOKIE_NAME } from "@/lib/auth/session-cookie";
import { resolveSessionTokenToUserId } from "@/lib/auth/db-session";
import { getMobileAuthUser } from "@/lib/mobile/mobileAuth";

async function getMobileSessionUserId(request: Request | NextRequest) {
  const auth = request.headers.get("authorization");
  if (auth?.startsWith("Bearer ")) {
    const token = auth.slice(7).trim();
    const userId = await resolveSessionTokenToUserId(token);
    if (userId) return userId;
  }

  const cookieHeader = request.headers.get("cookie");
  const cookieToken = getCookieValueFromHeader(cookieHeader, AUTH_SESSION_COOKIE_NAME);
  return resolveSessionTokenToUserId(cookieToken);
}

const guestSelect = {
  id: true,
  email: true,
  name: true,
  phone: true,
  role: true,
  homeCity: true,
  homeRegion: true,
  homeCountry: true,
  createdAt: true,
} as const;

export async function requireMobileGuestUser(request: Request | NextRequest) {
  const userId = await getMobileSessionUserId(request);
  if (userId) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: guestSelect,
    });
    if (user) return user;
  }

  const mobile = await getMobileAuthUser(request);
  if (!mobile) return null;

  let user = await prisma.user.findUnique({
    where: { id: mobile.id },
    select: guestSelect,
  });
  if (!user && mobile.email) {
    user = await prisma.user.findUnique({
      where: { email: mobile.email },
      select: guestSelect,
    });
  }
  return user;
}

export function normalizeMobilePlatform(value: unknown) {
  const platform = typeof value === "string" ? value.trim().toLowerCase() : "";
  if (platform === "ios" || platform === "android" || platform === "web") {
    return platform;
  }
  return null;
}

export function normalizePushProvider(value: unknown) {
  const provider = typeof value === "string" ? value.trim().toLowerCase() : "";
  if (provider === "expo" || provider === "fcm" || provider === "apns") {
    return provider;
  }
  return "expo";
}

export function mapMobileNotification(notification: {
  id: string;
  title: string;
  message: string | null;
  type: string;
  status: string;
  priority: string;
  actionUrl: string | null;
  actionLabel: string | null;
  createdAt: Date;
}) {
  return {
    id: notification.id,
    title: notification.title,
    message: notification.message,
    type: notification.type,
    status: notification.status,
    priority: notification.priority,
    actionUrl: notification.actionUrl,
    actionLabel: notification.actionLabel,
    createdAt: notification.createdAt.toISOString(),
  };
}

export function mapMobileTrip(booking: any) {
  return {
    id: booking.id,
    status: booking.status,
    checkIn: booking.checkIn.toISOString(),
    checkOut: booking.checkOut.toISOString(),
    nights: booking.nights,
    confirmationCode: booking.confirmationCode ?? null,
    totalCents: booking.totalCents,
    guestFeeCents: booking.guestFeeCents,
    paymentStatus: booking.bnhubReservationPayment?.paymentStatus ?? booking.payment?.status ?? null,
    listing: {
      id: booking.listing.id,
      title: booking.listing.title,
      city: booking.listing.city,
      photo:
        booking.listing.photos?.[0] ??
        booking.listing.listingPhotos?.[0] ??
        null,
      nightPriceCents: booking.listing.nightPriceCents ?? null,
    },
  };
}
