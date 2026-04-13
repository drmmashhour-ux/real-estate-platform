import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getGuestId } from "@/lib/auth/session";
import { getFsboPremiumPublishPriceCents, getFsboPublishPriceCents } from "@/lib/fsbo/constants";
import { getListingTransactionFlagsForListings } from "@/lib/fsbo/listing-transaction-flag";
import { ListingTransactionFlag } from "@/components/listings/ListingTransactionFlag";

export const dynamic = "force-dynamic";

export default async function FsboOwnerDashboardPage({
  searchParams,
}: {
  searchParams?: Promise<{ fsboPaid?: string }>;
}) {
  const userId = await getGuestId();
  if (!userId) redirect("/auth/login?returnUrl=/dashboard/fsbo");
  const { fsboPaid } = (await searchParams) ?? {};

  const listings = await prisma.fsboListing.findMany({
    where: { ownerId: userId },
    orderBy: { updatedAt: "desc" },
    include: {
      _count: { select: { leads: true } },
    },
  });
  const transactionFlags = await getListingTransactionFlagsForListings(
    listings.map((listing) => ({ id: listing.id, status: listing.status }))
  );

  const feeBasic = getFsboPublishPriceCents();
  const feePremium = getFsboPremiumPublishPriceCents();

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-10 text-slate-50">
      <div className="mx-auto max-w-4xl">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-2xl font-semibold">FSBO dashboard</h1>
            <p className="mt-1 text-sm text-slate-400">Your sell-by-owner listings and leads.</p>
            <Link href="/dashboard/command" className="mt-2 inline-block text-sm font-medium text-amber-300/95 hover:underline">
              Open command center (trust & deal overview) →
            </Link>
          </div>
          <Link
            href="/sell/create"
            className="rounded-xl bg-amber-500 px-4 py-2.5 text-center text-sm font-bold text-slate-950 hover:bg-amber-400"
          >
            New listing
          </Link>
        </div>

        {fsboPaid === "1" ? (
          <p className="mt-4 rounded-xl border border-emerald-500/40 bg-emerald-950/40 p-3 text-sm text-emerald-200">
            Payment received — your listing should be active shortly. Refresh if status still shows draft.
          </p>
        ) : null}

        <p className="mt-4 text-xs text-slate-500">
          Plans: <strong className="text-amber-300">${(feeBasic / 100).toFixed(2)}</strong> basic ·{" "}
          <strong className="text-amber-300">${(feePremium / 100).toFixed(2)}</strong> featured (one-time per listing).
        </p>

        <ul className="mt-8 space-y-4">
          {listings.map((l) => (
            <li
              key={l.id}
              className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="font-semibold text-white">{l.title}</h2>
                  {transactionFlags.get(l.id) ? (
                    <div className="mt-2">
                      <ListingTransactionFlag flag={transactionFlags.get(l.id)!} />
                    </div>
                  ) : null}
                  <p className="text-sm text-slate-400">
                    {l.city} · ${(l.priceCents / 100).toLocaleString()}
                  </p>
                  <p className="mt-2 text-xs text-slate-500">
                    Status: <span className="text-slate-300">{l.status}</span> · Moderation:{" "}
                    <span className="text-slate-300">{l.moderationStatus}</span>
                    {l.rejectReason ? (
                      <>
                        {" "}
                        — <span className="text-rose-300">{l.rejectReason}</span>
                      </>
                    ) : null}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    Plan:{" "}
                    <span className="text-slate-300">{l.publishPlan === "premium" ? "Featured" : "Basic"}</span>
                    {" · "}
                    Payment:{" "}
                    <span className="text-slate-300">
                      {l.status === "DRAFT"
                        ? "Unpaid (publish to pay)"
                        : l.paidPublishAt
                          ? `Paid ${((l.publishPriceCents ?? 0) / 100).toLocaleString(undefined, { style: "currency", currency: "CAD" })}`
                          : "Live"}
                    </span>
                    {l.featuredUntil && l.publishPlan === "premium" ? (
                      <span className="block text-[10px] text-amber-200/80">
                        Featured window until {l.featuredUntil.toISOString().slice(0, 10)}
                      </span>
                    ) : null}
                  </p>
                </div>
                <div className="text-right text-sm">
                  <p className="font-medium text-amber-300">{l._count.leads} leads</p>
                  {l.status === "ACTIVE" && l.moderationStatus === "APPROVED" ? (
                    <Link href={`/sell/${l.id}`} className="mt-1 block text-emerald-400 hover:underline">
                      View public page
                    </Link>
                  ) : null}
                  {l.status === "DRAFT" ? (
                    <Link
                      href={`/sell/create?id=${encodeURIComponent(l.id)}`}
                      className="mt-1 block text-slate-400 hover:text-white"
                    >
                      Continue editing →
                    </Link>
                  ) : null}
                </div>
              </div>

              {l._count.leads > 0 ? (
                <details className="mt-4 border-t border-slate-800 pt-4">
                  <summary className="cursor-pointer text-sm text-slate-400">Show leads</summary>
                  <FsboLeadsList listingId={l.id} />
                </details>
              ) : null}
            </li>
          ))}
        </ul>

        {listings.length === 0 ? (
          <p className="mt-10 text-center text-slate-500">
            No listings yet.{" "}
            <Link href="/sell/create" className="text-amber-400 underline">
              Create one
            </Link>
          </p>
        ) : null}
      </div>
    </main>
  );
}

async function FsboLeadsList({ listingId }: { listingId: string }) {
  const leads = await prisma.fsboLead.findMany({
    where: { listingId },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  return (
    <ul className="mt-3 space-y-2 text-sm">
      {leads.map((lead) => (
        <li key={lead.id} className="rounded-lg bg-slate-950/80 px-3 py-2">
          <span className="font-medium text-white">{lead.name}</span>{" "}
          <a href={`mailto:${lead.email}`} className="text-amber-400">
            {lead.email}
          </a>
          {lead.message ? (
            <p className="mt-1 text-xs text-slate-400 whitespace-pre-wrap">{lead.message}</p>
          ) : null}
          <p className="text-[10px] text-slate-600">{lead.createdAt.toISOString().slice(0, 16)}</p>
        </li>
      ))}
    </ul>
  );
}
