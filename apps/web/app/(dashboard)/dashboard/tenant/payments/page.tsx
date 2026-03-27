import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireAuthenticatedUser } from "@/lib/auth/require-session";
import { RentDecisionAiCard } from "@/components/rental/RentDecisionAiCard";
import { RentLifecycleTimeline } from "@/components/rental/RentLifecycleTimeline";

export const dynamic = "force-dynamic";

function money(cents: number) {
  return new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" }).format(cents / 100);
}

export default async function TenantRentPaymentsPage({
  searchParams,
}: {
  searchParams: Promise<{ applied?: string }>;
}) {
  const { userId } = await requireAuthenticatedUser();
  const sp = await searchParams;
  const showApplied = sp.applied === "1";

  const [payments, applications, leases] = await Promise.all([
    prisma.rentPayment.findMany({
      where: { lease: { tenantId: userId } },
      orderBy: { dueDate: "desc" },
      take: 100,
      include: {
        lease: {
          select: {
            id: true,
            status: true,
            listing: { select: { title: true, listingCode: true } },
          },
        },
      },
    }),
    prisma.rentalApplication.findMany({
      where: { tenantId: userId },
      orderBy: { createdAt: "desc" },
      take: 20,
      include: { listing: { select: { title: true, listingCode: true, id: true } } },
    }),
    prisma.rentalLease.findMany({
      where: { tenantId: userId },
      orderBy: { createdAt: "desc" },
      take: 10,
      include: { listing: { select: { title: true, listingCode: true } } },
    }),
  ]);

  const firstLeaseId = leases[0]?.id ?? null;
  const firstAppId = applications[0]?.id ?? null;
  const primaryApp = applications[0];
  const primaryLease = leases[0];

  return (
    <div className="mx-auto max-w-4xl space-y-10 px-4 py-10 text-slate-100">
      <header>
        <p className="text-xs font-semibold uppercase tracking-wide text-emerald-500/90">Rent Hub</p>
        <h1 className="mt-1 text-3xl font-semibold">Tenant · rent & payments</h1>
        <p className="mt-2 max-w-xl text-sm text-slate-400">
          Track applications, leases, and monthly rent status (demo tracking — not a bank transfer).
        </p>
      </header>

      {showApplied ? (
        <p className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
          Application submitted. The landlord will review it in their dashboard.
        </p>
      ) : null}

      <RentLifecycleTimeline
        applicationStatus={primaryApp?.status ?? null}
        leaseStatus={primaryLease?.status ?? null}
        hasPayments={payments.length > 0}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <RentDecisionAiCard hub="rent" entityType="platform" entityId={null} title="AI Tenant Risk" />
        {firstLeaseId ? (
          <RentDecisionAiCard
            hub="rent"
            entityType="rental_lease"
            entityId={firstLeaseId}
            title="AI Tenant Risk"
          />
        ) : firstAppId ? (
          <RentDecisionAiCard
            hub="rent"
            entityType="rental_application"
            entityId={firstAppId}
            title="AI Tenant Risk"
          />
        ) : null}
      </div>

      <section>
        <h2 className="text-lg font-medium">Applications</h2>
        <div className="mt-3 space-y-3">
          {applications.length === 0 ? (
            <p className="text-sm text-slate-500">
              No applications yet.{" "}
              <Link href="/rent" className="text-emerald-400 hover:underline">
                Browse long-term rentals
              </Link>
            </p>
          ) : (
            applications.map((a) => (
              <div key={a.id} className="rounded-xl border border-white/10 bg-slate-900/50 px-4 py-3 text-sm">
                <div className="flex flex-wrap justify-between gap-2">
                  <span className="font-medium text-white">{a.listing.title}</span>
                  <span className="text-xs text-slate-500">{a.status}</span>
                </div>
                <Link href={`/rent/${a.listing.id}`} className="mt-1 text-xs text-emerald-400 hover:underline">
                  View listing
                </Link>
              </div>
            ))
          )}
        </div>
      </section>

      <section>
        <h2 className="text-lg font-medium">Leases</h2>
        <div className="mt-3 space-y-3">
          {leases.length === 0 ? (
            <p className="text-sm text-slate-500">No leases yet.</p>
          ) : (
            leases.map((l) => (
              <Link
                key={l.id}
                href={`/rent/lease/${l.id}`}
                className="block rounded-xl border border-white/10 bg-slate-900/50 px-4 py-3 text-sm hover:bg-slate-900"
              >
                <span className="font-medium text-white">{l.listing.title}</span>
                <span className="ml-2 text-xs text-slate-500">{l.status}</span>
              </Link>
            ))
          )}
        </div>
      </section>

      <section>
        <h2 className="text-lg font-medium">Rent schedule</h2>
        <div className="mt-4 overflow-hidden rounded-2xl border border-white/10">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-900/80 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Due</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Property</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {payments.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-slate-500">
                    No rent rows yet.
                  </td>
                </tr>
              ) : (
                payments.map((p) => (
                  <tr key={p.id} className="hover:bg-white/[0.02]">
                    <td className="px-4 py-3 text-slate-300">
                      Payment due — {p.dueDate.toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" })}
                    </td>
                    <td className="px-4 py-3">{money(p.amount)}</td>
                    <td className="px-4 py-3 text-slate-400">
                      {p.status === "PAID" ? "Paid" : p.status === "LATE" ? "Late" : "Pending"}
                    </td>
                    <td className="px-4 py-3 text-slate-500">
                      {p.lease.listing.title}
                      {p.lease.listing.listingCode ? (
                        <span className="block font-mono text-xs text-slate-600">Code: {p.lease.listing.listingCode}</span>
                      ) : null}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
