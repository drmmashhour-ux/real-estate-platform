import { redirect } from "next/navigation";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@repo/db";
import { isFinancialStaff } from "@/lib/admin/finance-access";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Tax overview — Admin",
  description: "Québec QST and federal GST/HST registration snapshot for internal reference.",
};

/**
 * Lightweight registration / deadline snapshot at `/admin/finance/taxes`.
 * For operational remittance totals and exports, use the localized finance hub taxes page.
 */
export default async function TaxDashboardPage() {
  const userId = await getGuestId();
  if (!userId) redirect("/auth/login");

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  if (!isFinancialStaff(user?.role)) redirect("/");

  return (
    <div className="min-h-screen bg-[#0a0a0a] px-6 py-10 text-slate-200">
      <div className="mx-auto max-w-2xl space-y-8">
        <div>
          <h1 className="text-2xl font-semibold text-white">Tax overview</h1>
          <p className="mt-2 text-sm text-slate-400">
            Internal reference only — confirm amounts and deadlines with your accountant and CRA / Revenu Québec.
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 space-y-6">
          <section>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">QST (Québec)</h2>
            <p className="mt-2 font-mono text-lg text-white tabular-nums">4025075621</p>
          </section>

          <section>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">GST / HST</h2>
            <p className="mt-2 font-mono text-lg text-white tabular-nums">766525877RT0001</p>
          </section>

          <section>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Next filing deadline (reference)</h2>
            <p className="mt-2 text-lg text-white">April 30, 2026</p>
            <p className="mt-1 text-xs text-slate-500">Update when your filing calendar changes.</p>
          </section>
        </div>

        <p className="text-center text-sm text-slate-500">
          For live remittance totals and CSV export, use the localized admin finance hub <strong>Taxes</strong> page.
        </p>
      </div>
    </div>
  );
}
