import Link from "next/link";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();
import { requireAuthenticatedUser } from "@/lib/auth/require-session";
import { RentDecisionAiCard } from "@/components/rental/RentDecisionAiCard";
import { LandlordMarkPaidButton } from "./landlord-mark-paid-button";

export const dynamic = "force-dynamic";

function money(cents: number) {
  return new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" }).format(cents / 100);
}

export default async function LandlordRentPaymentsPage() {
  const { userId } = await requireAuthenticatedUser();

  const payments = await prisma.rentPayment.findMany({
    where: { lease: { landlordId: userId } },
    orderBy: { dueDate: "desc" },
    take: 100,
    include: {
      lease: {
        select: {
          id: true,
          tenant: { select: { name: true, email: true } },
          listing: { select: { title: true, listingCode: true } },
        },
      },
    },
  });

  const firstLeaseIdForAi = payments[0]?.lease.id ?? null;

  return (
    <div className="mx-auto max-w-4xl space-y-10 px-4 py-10 text-slate-100">
      <header>
        <p className="text-xs font-semibold uppercase tracking-wide text-amber-500/90">Rent Hub</p>
        <h1 className="mt-1 text-3xl font-semibold">Landlord · rent payments</h1>
        <p className="mt-2 max-w-xl text-sm text-slate-400">
          Track monthly rent (demo). Mark a row as paid when funds clear — no live payment processor in this flow.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-2">
        <RentDecisionAiCard hub="rent" entityType="platform" entityId={null} title="AI Tenant Risk" />
        {firstLeaseIdForAi ? (
          <RentDecisionAiCard
            hub="rent"
            entityType="rental_lease"
            entityId={firstLeaseIdForAi}
            title="Lease & late-payment risk"
          />
        ) : null}
      </div>

      <p className="text-sm text-slate-500">
        <Link href="/dashboard/landlord" className="text-amber-400 hover:underline">
          ← Landlord dashboard
        </Link>
      </p>

      <section>
        <h2 className="text-lg font-medium">Rent schedule</h2>
        <div className="mt-4 overflow-hidden rounded-2xl border border-white/10">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-900/80 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Due</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Tenant</th>
                <th className="px-4 py-3">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {payments.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                    No payments yet. Accept an application to generate a rent schedule.
                  </td>
                </tr>
              ) : (
                payments.map((p) => (
                  <tr key={p.id} className="hover:bg-white/[0.02]">
                    <td className="px-4 py-3 text-slate-300">{p.dueDate.toISOString().slice(0, 10)}</td>
                    <td className="px-4 py-3">{money(p.amount)}</td>
                    <td className="px-4 py-3 text-slate-400">{p.status}</td>
                    <td className="px-4 py-3 text-slate-500">
                      {p.lease.tenant.name ?? p.lease.tenant.email ?? "—"}
                    </td>
                    <td className="px-4 py-3">
                      {p.status === "PENDING" || p.status === "LATE" ? (
                        <LandlordMarkPaidButton paymentId={p.id} />
                      ) : (
                        <span className="text-xs text-slate-600">—</span>
                      )}
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
