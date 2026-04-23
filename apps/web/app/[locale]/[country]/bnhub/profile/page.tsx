import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { BnhubMobileTabBar } from "@/components/bnhub/BnhubMobileTabBar";
import { prisma } from "@repo/db";
import { getGuestId } from "@/lib/auth/session";
import { buildPageMetadata } from "@/lib/seo/page-metadata";
import { seoConfig } from "@/lib/seo/config";
import { OG_DEFAULT_BNHUB } from "@/lib/seo/og-defaults";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; country: string }>;
}): Promise<Metadata> {
  const { locale, country } = await params;
  return buildPageMetadata({
    title: `Profile — BNHUB | ${seoConfig.siteName}`,
    description: `Your BNHUB traveller profile, trips, and saved context on ${seoConfig.siteName}.`,
    path: "/bnhub/profile",
    locale,
    country,
    ogImage: OG_DEFAULT_BNHUB,
    ogImageAlt: "BNHUB profile",
  });
}

export default async function BnhubGuestProfilePage() {
  const userId = await getGuestId();
  if (!userId) {
    redirect("/auth/login?next=/bnhub/profile");
  }

  const [user, bookingCount, loyalty] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, email: true, bnhubGuestRatingAverage: true, bnhubGuestTotalStays: true },
    }),
    prisma.booking.count({
      where: { guestId: userId, status: { in: ["CONFIRMED", "COMPLETED"] } },
    }),
    prisma.userLoyaltyProfile.findUnique({
      where: { userId },
      select: { tier: true, completedBookings: true },
    }),
  ]);

  const initial = (user?.name ?? user?.email ?? "?").slice(0, 1).toUpperCase();

  return (
    <div className="bnhub-page min-h-screen pb-24 md:pb-8">
      <header className="border-b border-bnhub-border bg-bnhub-elevated/90 px-4 py-4 backdrop-blur">
        <h1 className="text-center text-lg font-semibold tracking-wide text-bnhub-gold">Profile</h1>
      </header>

      <div className="mx-auto max-w-lg px-4 py-8">
        <div className="bnhub-card bnhub-card--elevated flex flex-col items-center text-center">
          <div className="flex h-24 w-24 items-center justify-center rounded-full border-2 border-bnhub-gold/40 bg-gradient-to-br from-bnhub-elevated to-bnhub-main text-3xl font-semibold text-bnhub-gold shadow-lg">
            {initial}
          </div>
          <p className="mt-4 text-lg font-semibold text-bnhub-text">{user?.name ?? "Guest"}</p>
          <p className="text-sm text-bnhub-text-secondary">{user?.email}</p>
          {user?.bnhubGuestRatingAverage != null ? (
            <p className="mt-3 text-sm text-bnhub-gold">
              Guest rating {user.bnhubGuestRatingAverage.toFixed(1)}★ · {user.bnhubGuestTotalStays} stays
            </p>
          ) : (
            <p className="mt-3 text-sm text-bnhub-text-muted">Complete a stay to build your guest rating.</p>
          )}
          {loyalty ? (
            <p className="mt-2 text-xs uppercase tracking-wide text-bnhub-text-muted">
              Loyalty: {loyalty.tier} · {loyalty.completedBookings} completed
            </p>
          ) : null}
        </div>

        <div className="mt-6 grid gap-3">
          <Link
            href="/bnhub/trips"
            className="bnhub-card bnhub-card--elevated flex items-center justify-between transition hover:border-bnhub-gold/30"
          >
            <span className="font-medium text-bnhub-text">Trips</span>
            <span className="text-sm text-bnhub-text-muted">{bookingCount} active / past</span>
          </Link>
          <Link
            href="/dashboard/bnhub"
            className="bnhub-card bnhub-card--elevated flex items-center justify-between transition hover:border-bnhub-gold/30"
          >
            <span className="font-medium text-bnhub-text">Host dashboard</span>
            <span className="text-sm text-bnhub-gold">Earnings & bookings</span>
          </Link>
          <Link
            href="/dashboard/bnhub/messages"
            className="bnhub-card bnhub-card--elevated flex items-center justify-between transition hover:border-bnhub-gold/30"
          >
            <span className="font-medium text-bnhub-text">Messages</span>
            <span className="text-sm text-bnhub-text-muted">Inbox</span>
          </Link>
        </div>

        <p className="mt-8 text-center text-xs text-bnhub-text-muted">
          Response times and host-facing metrics appear in the host dashboard when you list a space.
        </p>
      </div>

      <BnhubMobileTabBar />
    </div>
  );
}
