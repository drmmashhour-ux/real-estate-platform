import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getGuestId } from "@/lib/auth/session";
import { isPlatformAdmin } from "@/lib/auth/is-platform-admin";
import { loadBnhubEthicalSeedingAdminStats } from "@/lib/bnhub/bnhub-ethical-seeding-admin";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "BNHub ethical seeding",
  description: "Real views, saves, and bookings — transparent activity signals.",
};

export default async function AdminBnhubEthicalSeedingPage() {
  const guestId = await getGuestId();
  if (!guestId) redirect("/en/ca/auth/login?next=/admin/bnhub-ethical-seeding");
  if (!(await isPlatformAdmin(guestId))) redirect("/");

  const stats = await loadBnhubEthicalSeedingAdminStats();

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-bold text-slate-900">BNHub ethical seeding</h1>
      <p className="mt-2 text-sm text-slate-600">
        Last {stats.rangeDays} days (since {new Date(stats.since).toLocaleString()}). Counts are from production
        tables only — no synthetic bookings or reviews.
      </p>
      <ul className="mt-8 space-y-4">
        <li className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Listing detail views</p>
          <p className="mt-1 text-2xl font-semibold text-slate-900">{stats.listingDetailViewsSearchEvents}</p>
          <p className="mt-1 text-xs text-slate-500">
            From <code className="text-[11px]">search_events</code> with type VIEW (BNHub stay pages).
          </p>
        </li>
        <li className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">New saves (wishlist)</p>
          <p className="mt-1 text-2xl font-semibold text-slate-900">{stats.newWishlistSaves}</p>
          <p className="mt-1 text-xs text-slate-500">
            Rows added to <code className="text-[11px]">bnhub_guest_favorites</code> in window. All-time:{" "}
            {stats.totalWishlistRows}.
          </p>
        </li>
        <li className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Bookings (confirmed / completed)</p>
          <p className="mt-1 text-2xl font-semibold text-slate-900">{stats.confirmedOrCompletedBookings}</p>
        </li>
        <li className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Lifetime view counter (sum)</p>
          <p className="mt-1 text-2xl font-semibold text-slate-900">{stats.sumLifetimeListingViewCounter}</p>
          <p className="mt-1 text-xs text-slate-500">Sum of <code className="text-[11px]">bnhub_listing_view_count</code> across listings.</p>
        </li>
      </ul>
    </div>
  );
}
