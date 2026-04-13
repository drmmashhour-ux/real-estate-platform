import Link from "next/link";
import { redirect } from "next/navigation";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

const GOLD = "var(--color-premium-gold)";

export default async function BrokerContractsOffersPage() {
  const userId = await getGuestId();
  if (!userId) redirect("/auth/login?next=/dashboard/broker/contracts-offers");
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true, name: true, email: true },
  });
  if (user?.role !== "BROKER" && user?.role !== "ADMIN") redirect("/dashboard");

  const [contracts, offers, records] = await Promise.all([
    prisma.contract.findMany({
      where: {
        OR: [{ userId }, { createdById: userId }, { signatures: { some: { userId } } }],
        type: {
          in: [
            "broker_agreement_seller",
            "broker_agreement_buyer",
            "referral_agreement",
            "collaboration_agreement",
            "purchase_offer",
            "rental_offer",
          ],
        },
      },
      orderBy: { createdAt: "desc" },
      take: 40,
    }),
    prisma.offerDocument.findMany({
      where: { createdById: userId },
      orderBy: { createdAt: "desc" },
      take: 40,
    }),
    prisma.brokerTransactionRecord.findMany({
      where: { brokerId: userId },
      orderBy: { createdAt: "desc" },
      take: 40,
    }),
  ]);

  const lost = records.filter((r) => r.outcome === "lost").length;

  return (
    <main className="min-h-screen bg-[#0B0B0B] text-slate-100">
      <div className="mx-auto max-w-4xl px-4 py-10">
        <Link href="/dashboard/broker" className="text-sm hover:underline" style={{ color: GOLD }}>
          ← Broker hub
        </Link>
        <h1 className="mt-4 text-2xl font-semibold text-white">Contracts &amp; offers</h1>
        <p className="mt-2 text-sm text-slate-400">
          Broker agreements, auto-generated offers, and transaction records (including unsuccessful transactions).
        </p>
        <p className="mt-2 text-xs text-slate-500">
          Tax summaries are internal tools — verify with a CPA.{" "}
          <a href="/api/tax/broker-summary?format=csv" className="underline" style={{ color: GOLD }}>
            Export CSV
          </a>
        </p>

        <section className="mt-8 rounded-2xl border border-white/10 bg-black/40 p-6">
          <h2 className="text-lg font-medium" style={{ color: GOLD }}>
            Transaction loss records (unsuccessful transactions)
          </h2>
          <p className="mt-1 text-sm text-slate-400">
            Lost deals: <strong className="text-slate-200">{lost}</strong> — use{" "}
            <code className="text-xs">POST /api/broker/transaction-records</code> with outcome{" "}
            <code className="text-xs">lost</code> and a <code className="text-xs">lossReason</code>.
          </p>
        </section>

        <section className="mt-8">
          <h2 className="text-lg font-medium text-slate-200">Offers</h2>
          <ul className="mt-3 space-y-2">
            {offers.length === 0 ? (
              <li className="text-slate-500">No offers yet.</li>
            ) : (
              offers.map((o) => (
                <li key={o.id} className="flex justify-between rounded-lg border border-white/10 px-3 py-2 text-sm">
                  <span>
                    {o.type} · {o.status}
                  </span>
                  {o.contractId ? (
                    <Link href={`/contracts/${o.contractId}`} className="font-medium" style={{ color: GOLD }}>
                      Open
                    </Link>
                  ) : null}
                </li>
              ))
            )}
          </ul>
        </section>

        <section className="mt-8">
          <h2 className="text-lg font-medium text-slate-200">Broker agreements &amp; offers (contracts)</h2>
          <ul className="mt-3 space-y-2">
            {contracts.length === 0 ? (
              <li className="text-slate-500">None yet.</li>
            ) : (
              contracts.map((c) => (
                <li key={c.id} className="flex justify-between rounded-lg border border-white/10 px-3 py-2 text-sm">
                  <span>
                    {c.type} · {c.status}
                  </span>
                  <Link href={`/contracts/${c.id}`} className="font-medium" style={{ color: GOLD }}>
                    Open
                  </Link>
                </li>
              ))
            )}
          </ul>
        </section>
      </div>
    </main>
  );
}
