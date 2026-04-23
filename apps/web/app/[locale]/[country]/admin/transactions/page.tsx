import Link from "next/link";
import { redirect } from "next/navigation";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@repo/db";
import { AdminTransactionsClient } from "./admin-transactions-client";
import { isFinancialStaff } from "@/lib/admin/finance-access";

export const dynamic = "force-dynamic";

export default async function AdminTransactionsPage() {
  const uid = await getGuestId();
  if (!uid) redirect("/auth/login");
  const actor = await prisma.user.findUnique({ where: { id: uid }, select: { role: true } });
  if (!isFinancialStaff(actor?.role)) redirect("/");

  const [transactions, frozenCount] = await Promise.all([
    prisma.realEstateTransaction.findMany({
      include: {
        propertyIdentity: { select: { id: true, propertyUid: true, officialAddress: true } },
        buyer: { select: { id: true, name: true, email: true } },
        seller: { select: { id: true, name: true, email: true } },
        broker: { select: { id: true, name: true, email: true } },
        deposits: { select: { id: true, amount: true, paymentStatus: true } },
      },
      orderBy: { updatedAt: "desc" },
      take: 100,
    }),
    prisma.realEstateTransaction.count({ where: { frozenByAdmin: true } }),
  ]);

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      <div className="mx-auto max-w-6xl px-4 py-8">
        <Link href="/admin" className="text-sm text-amber-400 hover:text-amber-300">← Admin</Link>
        <h1 className="mt-4 text-2xl font-semibold">Transaction monitoring</h1>
        <p className="mt-1 text-slate-400">
          Monitor transactions, escrow deposits, freeze suspicious transactions.
        </p>
        <p className="mt-2 text-sm text-slate-500">Frozen: {frozenCount}</p>
        <AdminTransactionsClient
          initialTransactions={transactions.map((t) => ({
            id: t.id,
            property_identity: t.propertyIdentity,
            buyer: t.buyer,
            seller: t.seller,
            broker: t.broker,
            offer_price: t.offerPrice,
            status: t.status,
            frozen_by_admin: t.frozenByAdmin,
            deposits: t.deposits,
            created_at: t.createdAt,
            updated_at: t.updatedAt,
          }))}
        />
      </div>
    </main>
  );
}
