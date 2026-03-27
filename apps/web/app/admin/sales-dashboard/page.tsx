import Link from "next/link";
import { redirect } from "next/navigation";
import { getGuestId } from "@/lib/auth/session";
import { requireAdminUser } from "@/modules/analytics/services/require-admin";
import { SalesDashboardClient } from "@/components/admin/sales/SalesDashboardClient";

export const dynamic = "force-dynamic";

export default async function AdminSalesDashboardPage() {
  const uid = await getGuestId();
  const admin = await requireAdminUser(uid);
  if (!admin) redirect("/admin");

  return (
    <main className="mx-auto max-w-7xl px-4 py-10 text-slate-100">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#C9A646]">B2B sales</p>
      <h1 className="mt-2 text-3xl font-semibold">Enterprise sales CRM</h1>
      <p className="mt-2 max-w-2xl text-sm text-slate-400">
        Pipeline for property managers, agencies, and operators. No outcome guarantees — structured tracking and
        repeatable conversations. Playbook:{" "}
        <code className="rounded bg-slate-800 px-1 py-0.5 text-xs">docs/enterprise-sales.md</code>. Migration:{" "}
        <code className="rounded bg-slate-800 px-1 py-0.5 text-xs">pnpm --filter @lecipm/web exec prisma migrate dev</code>
      </p>
      <div className="mt-4 flex flex-wrap gap-4 text-sm">
        <Link href="/admin/enterprise-dashboard" className="text-emerald-400 hover:text-emerald-300">
          Enterprise analytics →
        </Link>
        <Link href="/admin/growth-crm" className="text-slate-400 hover:text-slate-300">
          Growth CRM
        </Link>
      </div>
      <div className="mt-10">
        <SalesDashboardClient />
      </div>
    </main>
  );
}
