import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { E_SIGN_CONTRACT_TYPES } from "@/lib/hubs/contract-types";
import { isInvestmentFeaturesEnabled } from "@/lib/compliance/investment-features";
import { ContractsStatusTabs } from "./contracts-status-tabs";

export const dynamic = "force-dynamic";

const CONTRACT_TYPE_LABELS: Record<string, string> = {
  booking_contract: "Booking agreement",
  listing_contract: "Listing agreement",
  lease: "Residential lease (e-sign)",
  broker_agreement: "Broker agreement",
  broker_agreement_seller: "Broker agreement (seller)",
  broker_agreement_buyer: "Broker agreement (buyer)",
  referral_agreement: "Referral agreement",
  collaboration_agreement: "Broker collaboration",
  purchase_offer: "Purchase offer",
  rental_offer: "Rental offer",
  investment_agreement: "Investment agreement",
  SELLER_AGREEMENT: "Seller listing agreement",
  PLATFORM_TERMS: "Platform marketplace terms",
  BROKER_COLLABORATION: "Broker collaboration",
  BROKER_AGREEMENT: "Broker collaboration & commission",
  RENTAL_AGREEMENT: "Long-term rental agreement",
  HOST_AGREEMENT: "Short-term host agreement",
};

const MARKETPLACE_PENDING_TYPES = new Set([
  "SELLER_AGREEMENT",
  "PLATFORM_TERMS",
  "HOST_AGREEMENT",
  "RENTAL_AGREEMENT",
  "BROKER_AGREEMENT",
  "BROKER_COLLABORATION",
]);

function filterContracts<T extends { status: string }>(
  list: T[],
  status: string | undefined
): T[] {
  if (!status || status === "all") return list;
  if (status === "signed") {
    return list.filter((c) => c.status === "signed" || c.status === "completed");
  }
  return list.filter((c) => c.status === status);
}

export default async function DashboardContractsPage({
  searchParams,
}: {
  searchParams?: Promise<{ status?: string }>;
}) {
  const userId = await getGuestId();
  if (!userId) redirect("/auth/login?next=/dashboard/contracts");

  const sp = (await searchParams) ?? {};
  const statusFilter = sp.status;

  const investmentOn = await isInvestmentFeaturesEnabled();
  const contracts = await prisma.contract.findMany({
    where: {
      ...(investmentOn ? {} : { NOT: { type: "investment_agreement" } }),
      OR: [{ userId }, { signatures: { some: { userId } } }, { createdById: userId }],
    },
    orderBy: { createdAt: "desc" },
    take: 120,
  });

  const filtered = filterContracts(contracts, statusFilter);

  const pendingMarketplace = contracts.filter(
    (c) => c.status === "pending" && MARKETPLACE_PENDING_TYPES.has(c.type)
  );
  const signedMarketplace = contracts.filter(
    (c) =>
      MARKETPLACE_PENDING_TYPES.has(c.type) && (c.status === "signed" || c.status === "completed")
  );

  const bookingIds = await prisma.booking
    .findMany({
      where: { guestId: userId },
      select: { id: true },
    })
    .then((r) => r.map((b) => b.id));
  const platformAgreements =
    bookingIds.length > 0
      ? await prisma.platformAgreement.findMany({
          where: {
            agreementType: "booking_agreement",
            relatedEntityType: "booking",
            relatedEntityId: { in: bookingIds },
          },
          orderBy: { acceptedAt: "desc" },
          take: 20,
        })
      : [];

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      <div className="mx-auto max-w-4xl px-4 py-8">
        <Link href="/dashboard" className="text-sm text-amber-400 hover:text-amber-300">
          ← Dashboard
        </Link>
        <h1 className="mt-4 text-2xl font-semibold">Contracts</h1>
        <p className="mt-1 text-slate-400">
          Review and sign required agreements for listings, bookings, and brokerage workflows. Filters apply to the
          list below.
        </p>

        <Suspense fallback={null}>
          <ContractsStatusTabs />
        </Suspense>

        {pendingMarketplace.length > 0 ? (
          <section className="mt-8 rounded-2xl border border-amber-500/30 bg-amber-950/20 p-5">
            <h2 className="text-lg font-medium text-amber-100">Action required</h2>
            <p className="mt-2 text-sm text-amber-200/80">
              Complete pending agreements before publishing, booking, or broker actions where applicable.
            </p>
            <ul className="mt-4 space-y-3">
              {pendingMarketplace.map((c) => (
                <li
                  key={c.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-800 bg-slate-900/60 px-4 py-3"
                >
                  <div>
                    <p className="font-medium text-slate-100">{CONTRACT_TYPE_LABELS[c.type] ?? c.type}</p>
                    <p className="text-xs text-slate-500">
                      {c.fsboListingId ? `FSBO ${c.fsboListingId.slice(0, 8)}…` : null}
                      {c.listingId ? ` · BNHub ${c.listingId.slice(0, 8)}…` : null}
                      {c.version ? ` · v${c.version}` : ""} · {c.status}
                    </p>
                  </div>
                  <Link
                    href={`/contracts/${c.id}`}
                    className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-bold text-slate-950 hover:bg-amber-400"
                  >
                    Review &amp; sign
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <section className="mt-8">
          <h2 className="text-lg font-medium text-slate-200">All agreements</h2>
          {contracts.length === 0 && platformAgreements.length === 0 ? (
            <p className="mt-2 text-sm text-slate-500">
              No contracts yet. Agreements appear when you create listings, become a host or broker, or book a stay.
            </p>
          ) : (
            <ul className="mt-4 space-y-3">
              {filtered.map((c) => (
                <li
                  key={c.id}
                  className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-900/60 px-4 py-3"
                >
                  <div>
                    <p className="font-medium text-slate-200">{CONTRACT_TYPE_LABELS[c.type] ?? c.type}</p>
                    <p className="text-xs text-slate-500">
                      {c.status}
                      {c.version ? ` · v${c.version}` : ""} · {new Date(c.createdAt).toLocaleDateString()}
                      {c.fsboListingId ? ` · FSBO ${c.fsboListingId.slice(0, 8)}…` : ""}
                      {c.listingId ? ` · BNHub ${c.listingId.slice(0, 8)}…` : ""}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    {c.status === "signed" || c.status === "completed" ? (
                      <span className="text-xs text-emerald-400">Signed</span>
                    ) : c.status === "pending" ? (
                      <span className="text-xs text-amber-300">Pending</span>
                    ) : c.status === "rejected" ? (
                      <span className="text-xs text-rose-400">Rejected</span>
                    ) : null}
                    {E_SIGN_CONTRACT_TYPES.has(c.type) ? (
                      <Link
                        href={`/contracts/${c.id}`}
                        className="text-xs font-medium text-amber-400 hover:text-amber-300"
                      >
                        Open
                      </Link>
                    ) : null}
                  </div>
                </li>
              ))}
              {platformAgreements.map((a) => (
                <li
                  key={a.id}
                  className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-900/60 px-4 py-3"
                >
                  <div>
                    <p className="font-medium text-slate-200">
                      {a.agreementType === "booking_agreement" ? "Booking agreement" : a.agreementType}
                    </p>
                    <p className="text-xs text-slate-500">Accepted {new Date(a.acceptedAt).toLocaleDateString()}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        {signedMarketplace.length > 0 && pendingMarketplace.length === 0 ? (
          <p className="mt-6 text-sm text-emerald-400/90">
            Marketplace agreements are up to date — continue with publish or checkout when other gates are satisfied.
          </p>
        ) : null}
      </div>
    </main>
  );
}
