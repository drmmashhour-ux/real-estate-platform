import Link from "next/link";
import { redirect } from "next/navigation";
import { getGuestId } from "@/lib/auth/session";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();
import { isFinancialStaff } from "@/lib/admin/finance-access";
import { BrokerTaxAdminClient } from "./broker-tax-admin-client";

export const dynamic = "force-dynamic";

export default async function AdminBrokerTaxPage() {
  const userId = await getGuestId();
  if (!userId) redirect("/auth/login");
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  if (!isFinancialStaff(user?.role)) redirect("/");

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      <div className="mx-auto max-w-4xl px-4 py-8">
        <Link href="/admin/finance" className="text-sm text-amber-400 hover:text-amber-300">
          ← Finance
        </Link>
        <h1 className="mt-4 text-2xl font-semibold">Broker tax registration (GST / QST)</h1>
        <p className="mt-2 text-sm text-slate-400">
          Review broker-provided numbers. Approve or reject for internal workflow only — not government verification.
        </p>
        <BrokerTaxAdminClient />
      </div>
    </main>
  );
}
