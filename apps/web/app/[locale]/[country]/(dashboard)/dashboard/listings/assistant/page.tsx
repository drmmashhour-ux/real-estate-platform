import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getGuestId } from "@/lib/auth/session";
import { ListingAssistantDashboardClient } from "@/components/listing-assistant/ListingAssistantDashboardClient";

export const dynamic = "force-dynamic";

export default async function ListingAssistantPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; country: string }>;
  searchParams: Promise<{ listingId?: string }>;
}) {
  const { locale, country } = await params;
  const sp = await searchParams;
  const prefix = `/${locale}/${country}`;

  const userId = await getGuestId();
  if (!userId) redirect(`/auth/login?returnUrl=${encodeURIComponent(`${prefix}/dashboard/listings/assistant`)}`);

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  if (user?.role !== "BROKER" && user?.role !== "ADMIN") {
    redirect(`${prefix}/dashboard/broker`);
  }

  const initialListingId = typeof sp.listingId === "string" ? sp.listingId : undefined;

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <div className="border-b border-slate-200 bg-white px-4 py-6 dark:border-slate-800 dark:bg-slate-900/80">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600 dark:text-emerald-400">
              AI Listing Assistant
            </p>
            <h1 className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">Create & optimize listings</h1>
            <p className="mt-1 max-w-2xl text-sm text-slate-600 dark:text-slate-400">
              The smartest way to create real estate listings — multilingual drafts, SEO hints, and Centris-ready export.
              Assistive only; no auto-submit to external boards.
            </p>
          </div>
          <Link
            href={`${prefix}/dashboard/listings`}
            className="text-sm font-medium text-emerald-700 hover:underline dark:text-emerald-400"
          >
            ← Back to listings
          </Link>
        </div>
      </div>
      <ListingAssistantDashboardClient initialListingId={initialListingId} />
    </main>
  );
}
