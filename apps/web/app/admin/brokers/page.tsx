import Link from "next/link";
import { redirect } from "next/navigation";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { IDENTITY_MANUAL_REVIEW_DISCLAIMER } from "@/modules/mortgage/services/broker-verification";
import { AdminBrokersClient } from "./AdminBrokersClient";
import { AdminMortgageBrokersClient } from "./AdminMortgageBrokersClient";

export const dynamic = "force-dynamic";

export default async function AdminBrokersPage() {
  const userId = await getGuestId();
  if (!userId) redirect("/login");
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  if (user?.role !== "ADMIN") redirect("/admin");

  const applications = await prisma.brokerApplication.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { id: true, email: true, name: true, role: true, brokerStatus: true } },
    },
  });

  const pendingMortgageBrokers = await prisma.mortgageBroker.findMany({
    where: {
      userId: { not: null },
      profileCompletedAt: { not: null },
      OR: [{ verificationStatus: "pending" }, { identityStatus: "pending" }],
    },
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { email: true } },
    },
  });

  const [
    billingLeadTotal,
    billingPaidLeads,
    billingRevenueAgg,
    leadsByBroker,
    paidLeadsByBroker,
    revenueByBroker,
    recentBrokerPayments,
  ] = await Promise.all([
    prisma.brokerLead.count().catch(() => 0),
    prisma.brokerLead.count({ where: { billingStatus: "paid" } }).catch(() => 0),
    prisma.brokerPayment
      .aggregate({
        where: { status: "success" },
        _sum: { amount: true },
      })
      .catch(() => ({ _sum: { amount: null as number | null } })),
    prisma.brokerLead
      .groupBy({
        by: ["brokerId"],
        _count: { _all: true },
      })
      .catch(() => [] as { brokerId: string; _count: { _all: number } }[]),
    prisma.brokerLead
      .groupBy({
        by: ["brokerId"],
        where: { billingStatus: "paid" },
        _count: { _all: true },
      })
      .catch(() => [] as { brokerId: string; _count: { _all: number } }[]),
    prisma.brokerPayment
      .groupBy({
        by: ["brokerId"],
        where: { status: "success" },
        _sum: { amount: true },
      })
      .catch(() => [] as { brokerId: string; _sum: { amount: number | null } }[]),
    prisma.brokerPayment
      .findMany({
        orderBy: { createdAt: "desc" },
        take: 20,
        include: { broker: { select: { email: true, name: true } } },
      })
      .catch(() => []),
  ]);

  const leadsByBrokerSorted = [...leadsByBroker].sort((a, b) => b._count._all - a._count._all).slice(0, 40);

  const paidMap = new Map(paidLeadsByBroker.map((r) => [r.brokerId, r._count._all]));
  const revenueMap = new Map(revenueByBroker.map((r) => [r.brokerId, r._sum.amount ?? 0]));
  const brokerIds = [...new Set(leadsByBrokerSorted.map((r) => r.brokerId))];
  const billingUsers =
    brokerIds.length > 0
      ? await prisma.user.findMany({
          where: { id: { in: brokerIds } },
          select: { id: true, email: true, name: true },
        }).catch(() => [])
      : [];
  const userById = new Map(billingUsers.map((u) => [u.id, u]));

  const mortgageRows = pendingMortgageBrokers.map((b) => ({
    id: b.id,
    fullName: b.fullName,
    name: b.name,
    email: b.email,
    phone: b.phone,
    company: b.company,
    licenseNumber: b.licenseNumber,
    yearsExperience: b.yearsExperience,
    specialties: b.specialties,
    profilePhotoUrl: b.profilePhotoUrl,
    idDocumentUrl: b.idDocumentUrl,
    selfiePhotoUrl: b.selfiePhotoUrl,
    insuranceProvider: b.insuranceProvider,
    insuranceValid: b.insuranceValid,
    brokerReferences: b.brokerReferences,
    verificationStatus: b.verificationStatus,
    identityStatus: b.identityStatus,
    createdAt: b.createdAt.toISOString(),
    user: b.user ? { email: b.user.email } : null,
  }));

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      <div className="mx-auto max-w-4xl px-4 py-8">
        <Link href="/admin" className="text-sm text-amber-400 hover:text-amber-300">
          ← Admin
        </Link>
        <h1 className="mt-4 text-2xl font-semibold">Broker certification</h1>
        <p className="mt-1 text-slate-400">
          Approve or reject broker applications. When approved, user becomes BROKER with brokerStatus verified.
        </p>
        <AdminBrokersClient applications={applications} />

        <section className="mt-14 border-t border-slate-800 pt-10">
          <h2 className="text-lg font-medium text-slate-200">Assigned-lead billing (LECIPM)</h2>
          <p className="mt-1 text-sm text-slate-400">
            Pay-per-assigned-lead and batch invoice checkouts. APIs:{" "}
            <code className="text-slate-300">POST /api/broker-billing/checkout</code>,{" "}
            <code className="text-slate-300">POST /api/broker-billing/invoice-checkout</code>. Webhook{" "}
            <code className="text-slate-300">paymentType</code>:{" "}
            <code className="text-slate-300">broker_assigned_lead</code>,{" "}
            <code className="text-slate-300">broker_lead_invoice</code>.
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <div className="rounded-lg border border-slate-800 bg-slate-900/40 px-4 py-3">
              <div className="text-xs uppercase tracking-wide text-slate-500">Billable leads</div>
              <div className="mt-1 text-2xl font-semibold text-white">{billingLeadTotal}</div>
            </div>
            <div className="rounded-lg border border-slate-800 bg-slate-900/40 px-4 py-3">
              <div className="text-xs uppercase tracking-wide text-slate-500">Leads paid</div>
              <div className="mt-1 text-2xl font-semibold text-emerald-300">{billingPaidLeads}</div>
            </div>
            <div className="rounded-lg border border-slate-800 bg-slate-900/40 px-4 py-3">
              <div className="text-xs uppercase tracking-wide text-slate-500">Revenue (success)</div>
              <div className="mt-1 text-2xl font-semibold text-amber-200">
                ${(billingRevenueAgg._sum.amount ?? 0).toFixed(2)} CAD
              </div>
            </div>
          </div>

          {leadsByBrokerSorted.length > 0 ? (
            <div className="mt-6 overflow-x-auto rounded-lg border border-slate-800">
              <table className="min-w-full text-left text-sm text-slate-300">
                <thead className="border-b border-slate-800 bg-slate-900/60 text-xs uppercase text-slate-500">
                  <tr>
                    <th className="px-3 py-2">Broker</th>
                    <th className="px-3 py-2">Leads received</th>
                    <th className="px-3 py-2">Leads paid</th>
                    <th className="px-3 py-2">Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {leadsByBrokerSorted.map((row) => {
                    const u = userById.get(row.brokerId);
                    const label = u?.email ?? row.brokerId.slice(0, 10) + "…";
                    return (
                      <tr key={row.brokerId} className="border-b border-slate-800/80">
                        <td className="px-3 py-2 font-mono text-xs text-slate-400">{label}</td>
                        <td className="px-3 py-2">{row._count._all}</td>
                        <td className="px-3 py-2 text-emerald-300">{paidMap.get(row.brokerId) ?? 0}</td>
                        <td className="px-3 py-2 text-amber-200">
                          ${(revenueMap.get(row.brokerId) ?? 0).toFixed(2)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="mt-4 text-sm text-slate-500">No broker billing rows yet (assign brokers to CRM leads).</p>
          )}

          {recentBrokerPayments.length > 0 ? (
            <div className="mt-8">
              <h3 className="text-sm font-medium text-slate-300">Recent payments</h3>
              <ul className="mt-2 space-y-2 text-xs text-slate-400">
                {recentBrokerPayments.map((p) => (
                  <li
                    key={p.id}
                    className="flex flex-wrap items-baseline justify-between gap-2 rounded border border-slate-800/80 bg-slate-900/30 px-3 py-2"
                  >
                    <span>
                      {p.broker.email} ·{" "}
                      <span className={p.status === "success" ? "text-emerald-400" : "text-rose-400"}>
                        {p.status}
                      </span>
                    </span>
                    <span className="font-mono text-slate-300">
                      ${p.amount.toFixed(2)} · {p.createdAt.toISOString().slice(0, 10)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </section>

        <section className="mt-14 border-t border-slate-800 pt-10">
          <h2 className="text-lg font-medium text-slate-200">Mortgage broker verification</h2>
          <p className="mt-1 text-sm text-slate-400">
            Profiles from <code className="text-slate-300">/broker/complete-profile</code>. Confirm license and identity
            (government ID + selfie) out of band, then use <strong className="font-medium text-slate-300">Verify manually</strong>{" "}
            for the license and <strong className="font-medium text-slate-300">Verify Identity</strong> for ID/selfie.
            Both must be approved before dashboard access.
          </p>
          <p className="mt-2 text-xs leading-relaxed text-slate-500">{IDENTITY_MANUAL_REVIEW_DISCLAIMER}</p>
          <AdminMortgageBrokersClient brokers={mortgageRows} />
        </section>
      </div>
    </main>
  );
}
