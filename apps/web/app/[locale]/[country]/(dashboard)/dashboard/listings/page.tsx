import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireAuthenticatedUser } from "@/lib/auth/require-session";
import { getAccessibleListingsForUser } from "@/lib/listings/get-accessible-listings-for-user";

export const dynamic = "force-dynamic";

/** Dashboard listings: broker CRM `Listing` rows (tenant + access), not BNHUB short-term inventory. */
export default async function DashboardListingsPage() {
  const { userId } = await requireAuthenticatedUser();
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  const isAdmin = user?.role === "ADMIN";

  const listings = await getAccessibleListingsForUser(userId, !!isAdmin);

  const demoIds: { id: string; title: string; city: string; country: string; nightPriceCents: number }[] = [
    { id: "1", title: "Luxury Villa", city: "Demo City", country: "US", nightPriceCents: 20000 },
    { id: "test-listing-1", title: "Luxury Villa", city: "Demo City", country: "US", nightPriceCents: 20000 },
    { id: "demo-listing-montreal", title: "Cozy loft in Old Montreal", city: "Montreal", country: "CA", nightPriceCents: 12500 },
  ];

  const showFallback = listings.length === 0;

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-50">
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <nav className="flex flex-wrap items-center gap-2 text-sm">
          <Link
            href="/bnhub/host/dashboard"
            className="font-medium text-emerald-600 hover:underline dark:text-emerald-400"
          >
            ← Dashboard
          </Link>
          <span className="text-slate-400">·</span>
          <span className="text-slate-500 dark:text-slate-500">Listings</span>
          <Link href="/dashboard/leads" className="text-slate-600 hover:underline dark:text-slate-400">
            Leads
          </Link>
          <Link href="/dashboard/billing" className="text-slate-600 hover:underline dark:text-slate-400">
            Billing
          </Link>
          <Link href="/dashboard/storage" className="text-slate-600 hover:underline dark:text-slate-400">
            Storage
          </Link>
        </nav>
        <h1 className="mt-6 text-2xl font-semibold tracking-tight">Listings</h1>
        <p className="mt-1 text-slate-600 dark:text-slate-400">
          CRM property listings for your workspace (codes, price, deal room). For vacation-rental BNHUB inventory, use the host dashboard.
        </p>

        {showFallback ? (
          <div className="mt-6 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-900 dark:text-amber-100">
            <p className="font-medium">No CRM listings in your workspace yet.</p>
            <p className="mt-1 text-amber-800/90 dark:text-amber-200/90">
              Run the full demo seed (<code className="rounded bg-black/10 px-1">npm run demo:full</code> in{" "}
              <code className="rounded bg-black/10 px-1">apps/web</code>) or create listings from the broker tools. Below is legacy BNHUB-style demo navigation only.
            </p>
          </div>
        ) : null}

        <ul className="mt-6 space-y-3">
          {showFallback
            ? demoIds.map((listing) => (
                <li key={listing.id}>
                  <Link
                    href={`/dashboard/listings/${listing.id}`}
                    className="block rounded-xl border border-slate-200 bg-white p-4 transition hover:border-slate-300 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900/60 dark:hover:border-slate-700 dark:hover:bg-slate-900/80"
                  >
                    <span className="font-medium">{listing.title}</span>
                    <span className="ml-2 text-slate-500 dark:text-slate-400">
                      {listing.city}, {listing.country}
                      {listing.nightPriceCents != null &&
                        ` · €${(listing.nightPriceCents / 100).toFixed(0)}/night`}
                    </span>
                  </Link>
                </li>
              ))
            : listings.map((listing) => (
                <li key={listing.id}>
                  <Link
                    href={`/dashboard/listings/${listing.id}`}
                    className="block rounded-xl border border-slate-200 bg-white p-4 transition hover:border-slate-300 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900/60 dark:hover:border-slate-700 dark:hover:bg-slate-900/80"
                  >
                    <span className="font-medium">{listing.title}</span>
                    <span className="ml-2 font-mono text-xs text-slate-500 dark:text-slate-400">{listing.listingCode}</span>
                    <span className="mt-1 block text-slate-600 dark:text-slate-300">
                      ${listing.price.toLocaleString()} CAD
                    </span>
                  </Link>
                </li>
              ))}
        </ul>
      </div>
    </main>
  );
}
