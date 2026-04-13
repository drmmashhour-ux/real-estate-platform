import Link from "next/link";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { getUserVerificationStatus } from "@/modules/bnhub-trust/services/identityVerificationService";
import { listSafeFlagsForHost } from "@/modules/bnhub-trust/services/riskFlagService";
import { BNHUB_TRUST_SAFE_COPY } from "@/modules/bnhub-trust/lib/safeCopy";

export const dynamic = "force-dynamic";

export default async function HostBnhubTrustPage() {
  const userId = await getGuestId();
  if (!userId) {
    return (
      <main className="min-h-screen bg-slate-950 px-4 py-12 text-slate-50">
        <Link href="/bnhub/login" className="text-emerald-400">
          Sign in
        </Link>
      </main>
    );
  }

  const [idv, listings, safeFlags] = await Promise.all([
    getUserVerificationStatus(userId),
    prisma.shortTermListing.findMany({
      where: { ownerId: userId },
      select: { id: true, title: true, city: true },
      orderBy: { updatedAt: "desc" },
      take: 30,
    }),
    listSafeFlagsForHost(userId),
  ]);

  const engines = await prisma.bnhubListingTrustRiskProfile.findMany({
    where: { listingId: { in: listings.map((l) => l.id) } },
  });
  const engineByListing = new Map(engines.map((e) => [e.listingId, e]));

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-10 text-slate-50">
      <div className="mx-auto max-w-xl space-y-6">
        <Link href="/host/bnhub/verification" className="text-sm text-emerald-400">
          Identity verification →
        </Link>
        <h1 className="text-2xl font-semibold">Listing trust</h1>
        <p className="text-sm text-slate-500">{BNHUB_TRUST_SAFE_COPY.reviewRequired}</p>

        <section className="rounded-xl border border-slate-800 bg-slate-900/40 p-4">
          <h2 className="text-sm font-medium text-slate-300">Your verification</h2>
          <p className="mt-2 text-sm text-slate-400">
            Status: {idv?.verificationStatus ?? "NOT_STARTED"}
          </p>
          <p className="mt-1 text-sm text-slate-500">{idv?.resultSummary ?? BNHUB_TRUST_SAFE_COPY.verificationIncomplete}</p>
        </section>

        {safeFlags.length > 0 ? (
          <section className="rounded-xl border border-amber-900/40 bg-amber-950/20 p-4">
            <h2 className="text-sm font-medium text-amber-200">Actions that may help</h2>
            <ul className="mt-2 space-y-2 text-sm text-slate-400">
              {safeFlags.map((f) => (
                <li key={f.id}>
                  <Link href={`/host/bnhub/trust/listings/${f.listingId}`} className="text-emerald-400">
                    Open listing
                  </Link>
                  <span className="ml-2">{f.summary}</span>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <section>
          <h2 className="text-sm font-semibold text-slate-400">Your listings</h2>
          <ul className="mt-2 divide-y divide-slate-800 rounded-xl border border-slate-800">
            {listings.length === 0 ? (
              <li className="p-4 text-sm text-slate-500">No listings yet.</li>
            ) : (
              listings.map((l) => {
                const e = engineByListing.get(l.id);
                return (
                  <li key={l.id} className="flex flex-col gap-1 p-3 text-sm">
                    <Link href={`/host/bnhub/trust/listings/${l.id}`} className="font-medium text-emerald-400">
                      {l.title}
                    </Link>
                    <span className="text-xs text-slate-500">{l.city}</span>
                    {e ? (
                      <span className="text-xs text-slate-500">
                        Status: {e.trustStatus}
                        {e.payoutRestrictionStatus !== "NONE" ? ` · ${BNHUB_TRUST_SAFE_COPY.payoutHoldGeneric}` : ""}
                        {e.promotionEligibilityStatus === "BLOCKED" ? ` · ${BNHUB_TRUST_SAFE_COPY.promotionBlocked}` : ""}
                      </span>
                    ) : (
                      <span className="text-xs text-slate-600">Trust data will appear after the next review cycle.</span>
                    )}
                  </li>
                );
              })
            )}
          </ul>
        </section>
      </div>
    </main>
  );
}
