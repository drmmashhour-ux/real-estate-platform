import Link from "next/link";
import { redirect } from "next/navigation";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();
import { getGuestId } from "@/lib/auth/session";
import { fsboListingLifecycleUx } from "@/lib/fsbo/listing-verification";
import { EmptyState } from "@/components/ui/EmptyState";
import { RemindListingCodesButton } from "@/components/seller/RemindListingCodesButton";
import { bandAccent, scoreToVisualBand } from "@/lib/decision-engine/scoreVisual";
import { getListingTransactionFlagsForListings } from "@/lib/fsbo/listing-transaction-flag";
import { ListingTransactionFlag } from "@/components/listings/ListingTransactionFlag";
import { fsboCreateHrefWithOptionalTemplate } from "@/lib/listings/unified-listing-journey";

export const dynamic = "force-dynamic";

function badgeClass(ux: ReturnType<typeof fsboListingLifecycleUx>) {
  if (ux === "active") return "bg-emerald-500/20 text-emerald-300";
  if (ux === "draft") return "bg-slate-600/40 text-slate-300";
  if (ux === "rejected") return "bg-red-500/20 text-red-300";
  return "bg-amber-500/20 text-amber-200";
}

function badgeLabel(ux: ReturnType<typeof fsboListingLifecycleUx>) {
  if (ux === "active") return "ACTIVE";
  if (ux === "draft") return "DRAFT";
  if (ux === "rejected") return "REJECTED";
  return "PENDING_VERIFICATION";
}

type ListingsPageProps = { searchParams?: Promise<{ submitted?: string; code?: string }> };

export default async function SellerHubListingsPage({ searchParams }: ListingsPageProps) {
  const userId = await getGuestId();
  if (!userId) redirect("/auth/login?next=/dashboard/seller/listings");

  const sp = (await searchParams) ?? {};
  const showSubmittedBanner = sp.submitted === "1";
  const submittedCode = typeof sp.code === "string" && sp.code.trim() ? sp.code.trim() : null;

  const listings = await prisma.fsboListing.findMany({
    where: { ownerId: userId },
    orderBy: { updatedAt: "desc" },
    take: 50,
    include: { verification: true },
  });
  const transactionFlags = await getListingTransactionFlagsForListings(
    listings.map((listing) => ({ id: listing.id, status: listing.status }))
  );

  return (
    <main className="min-h-screen bg-[#0B0B0B] px-4 py-10 text-slate-100">
      <div className="mx-auto max-w-3xl">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-semibold">My listings</h1>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/dashboard/command"
              className="rounded-xl border border-premium-gold/40 px-4 py-2 text-sm font-semibold text-premium-gold"
            >
              Command center
            </Link>
            <Link
              href={fsboCreateHrefWithOptionalTemplate(listings[0]?.id)}
              className="rounded-xl bg-premium-gold px-4 py-2 text-sm font-semibold text-black"
            >
              {listings.length > 0 ? "Add listing (from last)" : "Create listing"}
            </Link>
          </div>
        </div>
        {showSubmittedBanner ? (
          <div className="mt-6 rounded-2xl border border-emerald-500/35 bg-emerald-950/25 px-4 py-3 text-sm text-emerald-100/95">
            <p className="font-semibold text-emerald-50">Submitted for verification</p>
            <p className="mt-1 text-emerald-100/85">
              Our team will review your file. You’ll get an email when the listing goes live or if we need changes.
            </p>
            {submittedCode ? (
              <p className="mt-2 font-mono text-xs text-emerald-200/90">
                Listing code: <span className="text-white">{submittedCode}</span>
              </p>
            ) : null}
          </div>
        ) : null}
        <RemindListingCodesButton />
        <ul className="mt-8 space-y-4">
          {listings.map((l) => {
            const ux = fsboListingLifecycleUx(l.status, l.moderationStatus, l.verification);
            const trustBand = scoreToVisualBand(l.trustScore ?? 0);
            const trustAccent = bandAccent(trustBand);
            return (
              <li key={l.id} className="rounded-2xl border border-white/10 bg-[#121212] p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <Link href={`/dashboard/seller/listings/${l.id}`} className="font-medium text-premium-gold hover:underline">
                      {l.title}
                    </Link>
                    {transactionFlags.get(l.id) ? (
                      <div className="mt-2">
                        <ListingTransactionFlag flag={transactionFlags.get(l.id)!} />
                      </div>
                    ) : null}
                    <p className="text-xs text-slate-500">
                      {l.city} · updated {l.updatedAt.toLocaleDateString()}
                    </p>
                    {l.listingCode ? (
                      <p className="mt-1 font-mono text-[11px] text-slate-600">Code {l.listingCode}</p>
                    ) : null}
                    {l.rejectReason && ux === "rejected" ? (
                      <p className="mt-2 text-sm text-red-300/90">Reason: {l.rejectReason}</p>
                    ) : null}
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${badgeClass(ux)}`}>
                      {badgeLabel(ux)}
                    </span>
                    <div className="text-right font-mono">
                      <p className="text-[9px] uppercase tracking-wide text-slate-500">Trust</p>
                      <p className={`text-xl font-bold tabular-nums ${trustAccent.text}`}>{l.trustScore ?? "—"}</p>
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
        {listings.length === 0 ? (
          <div className="mt-8">
            <EmptyState
              icon="✨"
              title="No listings yet"
              description="Publish when you’re ready — we walk you through photos, price, declaration, and verification so buyers see a complete file."
            >
              <>
                <Link
                  href="/dashboard/seller/create"
                  className="rounded-xl bg-premium-gold px-6 py-3 text-sm font-bold text-[#0B0B0B] shadow-lg shadow-premium-gold/25 transition hover:bg-premium-gold"
                >
                  Create listing
                </Link>
                <Link
                  href="/explore"
                  className="rounded-xl border border-white/15 px-6 py-3 text-sm font-medium text-white/80 transition hover:border-premium-gold/35 hover:text-white"
                >
                  See how buyers search
                </Link>
              </>
            </EmptyState>
          </div>
        ) : null}
      </div>
    </main>
  );
}
