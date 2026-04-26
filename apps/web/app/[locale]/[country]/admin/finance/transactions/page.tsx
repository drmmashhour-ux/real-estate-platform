import Link from "next/link";
import { redirect } from "next/navigation";
import { getGuestId } from "@/lib/auth/session";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();
import { isFinancialStaff } from "@/lib/admin/finance-access";
import { FinanceTransactionsClient } from "./finance-transactions-client";

export const dynamic = "force-dynamic";

export default async function AdminFinanceTransactionsPage() {
  const userId = await getGuestId();
  if (!userId) redirect("/auth/login");
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  if (!isFinancialStaff(user?.role)) redirect("/");

  const brokers = await prisma.user.findMany({
    where: {
      OR: [{ role: "BROKER" }, { brokerStatus: "VERIFIED" }],
    },
    select: { id: true, email: true, name: true },
    orderBy: { email: "asc" },
    take: 300,
  });

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      <div className="mx-auto max-w-7xl px-4 py-8">
        <Link href="/admin/finance" className="text-sm text-amber-400 hover:text-amber-300">
          ← Financial dashboard
        </Link>
        <h1 className="mt-4 text-2xl font-semibold">Platform transactions</h1>
        <p className="mt-2 text-sm text-slate-400">
          Stripe-linked platform payments with commissions, fees, and entity links. Data is permission-protected via API.
        </p>
        <FinanceTransactionsClient brokers={brokers} />
      </div>
    </main>
  );
}
