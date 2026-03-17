import Link from "next/link";
import { getGuestId } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function TransactionsDashboardPage() {
  const userId = await getGuestId();
  if (!userId) redirect("/login");

  const transactions = await prisma.realEstateTransaction.findMany({
    where: {
      OR: [{ buyerId: userId }, { sellerId: userId }, { brokerId: userId }],
    },
    include: {
      propertyIdentity: { select: { id: true, propertyUid: true, officialAddress: true, municipality: true, province: true } },
      buyer: { select: { name: true, email: true } },
      seller: { select: { name: true, email: true } },
    },
    orderBy: { updatedAt: "desc" },
    take: 50,
  });

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      <div className="mx-auto max-w-4xl px-4 py-8">
        <h1 className="text-2xl font-semibold">My transactions</h1>
        <p className="mt-1 text-slate-400">Offers, negotiations, deposits, and closing steps.</p>
        {transactions.length === 0 ? (
          <p className="mt-8 text-slate-500">You have no transactions yet.</p>
        ) : (
          <ul className="mt-6 space-y-4">
            {transactions.map((t) => {
              const role = t.buyerId === userId ? "Buyer" : t.sellerId === userId ? "Seller" : "Broker";
              return (
                <li key={t.id}>
                  <Link
                    href={`/transactions/${t.id}`}
                    className="block rounded-xl border border-slate-800 bg-slate-900/60 p-4 hover:border-slate-700"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="font-medium text-slate-100">
                          {t.propertyIdentity.officialAddress}
                          {t.propertyIdentity.municipality && `, ${t.propertyIdentity.municipality}`}
                          {t.propertyIdentity.province && ` ${t.propertyIdentity.province}`}
                        </p>
                        <p className="text-sm text-slate-400">
                          {role} · {t.status.replace(/_/g, " ")}
                          {t.offerPrice != null && ` · $${(t.offerPrice / 100).toLocaleString()}`}
                        </p>
                      </div>
                      <span className="text-slate-500">View →</span>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </main>
  );
}
