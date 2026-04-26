import Link from "next/link";
import { redirect } from "next/navigation";
import { getGuestId } from "@/lib/auth/session";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();
import { isFinancialStaff } from "@/lib/admin/finance-access";

export const dynamic = "force-dynamic";

const exportLink = (label: string, href: string) => (
  <li key={href}>
    <a href={href} className="text-amber-400 hover:text-amber-300">
      {label}
    </a>
    <span className="ml-2 text-xs text-slate-600">(auth required)</span>
  </li>
);

export default async function AdminFinanceReportsPage() {
  const userId = await getGuestId();
  if (!userId) redirect("/auth/login");
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  if (!isFinancialStaff(user?.role)) redirect("/");

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      <div className="mx-auto max-w-3xl px-4 py-8">
        <Link href="/admin/finance" className="text-sm text-amber-400 hover:text-amber-300">
          ← Financial dashboard
        </Link>
        <h1 className="mt-4 text-2xl font-semibold">Reports & exports</h1>
        <p className="mt-2 text-sm text-slate-400">
          Downloads use secured API routes. CSV files open in Excel. PDFs are concise summaries — use CSV for full reconciliation.
        </p>

        <div className="mt-8 card-premium space-y-6 p-6">
          <div>
            <h2 className="text-sm font-semibold text-slate-200">Transactions & revenue</h2>
            <ul className="mt-3 space-y-2 text-sm text-slate-400">
              {exportLink("Platform payments — CSV", "/api/admin/finance/export?format=csv&type=transactions")}
              {exportLink("Platform payments — PDF (truncated)", "/api/admin/finance/export?format=pdf&type=transactions")}
              {exportLink("Revenue roll-up — CSV", "/api/admin/finance/export?format=csv&type=revenue")}
            </ul>
          </div>
          <div>
            <h2 className="text-sm font-semibold text-slate-200">Commissions & payouts</h2>
            <ul className="mt-3 space-y-2 text-sm text-slate-400">
              {exportLink("Commissions — CSV", "/api/admin/finance/export?format=csv&type=commissions")}
              {exportLink("Broker payout batches — CSV", "/api/admin/finance/export?format=csv&type=payouts")}
              {exportLink("Broker payout batches — PDF (truncated)", "/api/admin/finance/export?format=pdf&type=payouts")}
            </ul>
          </div>
          <div>
            <h2 className="text-sm font-semibold text-slate-200">Tax document register</h2>
            <ul className="mt-3 space-y-2 text-sm text-slate-400">
              {exportLink("Generated documents — CSV", "/api/admin/finance/export?format=csv&type=tax_register")}
            </ul>
          </div>
          <div>
            <h2 className="text-sm font-semibold text-slate-200">Automation</h2>
            <p className="mt-2 text-xs text-slate-500">
              POST <code className="text-slate-400">/api/admin/finance/automation</code> with{" "}
              <code className="text-slate-400">{`{ "run": "monthly" | "yearly" }`}</code> — financial staff session or Bearer cron secret.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
