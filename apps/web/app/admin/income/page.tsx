import Link from "next/link";
import { redirect } from "next/navigation";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { AdminIncomeFilters } from "./admin-income-filters";
import { isFinancialStaff } from "@/lib/admin/finance-access";

export const dynamic = "force-dynamic";

type SearchParams = { plan?: string; dateFrom?: string; dateTo?: string };

export default async function AdminIncomePage({
  searchParams,
}: {
  searchParams?: Promise<SearchParams>;
}) {
  const uid = await getGuestId();
  if (!uid) redirect("/auth/login");
  const actor = await prisma.user.findUnique({ where: { id: uid }, select: { role: true } });
  if (!isFinancialStaff(actor?.role)) redirect("/");

  const params = (await searchParams) ?? {};
  const planFilter = params.plan?.trim() || undefined;
  const dateFrom = params.dateFrom ? new Date(params.dateFrom) : null;
  const dateTo = params.dateTo ? new Date(params.dateTo) : null;

  let canvaRevenue = 0;
  let canvaInvoices: { id: string; userId: string; usageId: string; amount: number; createdAt: Date; invoiceNumber: string | null; listingId: string | null }[] = [];
  let upgradeRevenue = 0;
  let upgradeInvoices: { id: string; userId: string; amount: number; plan: string; date: Date }[] = [];
  let canvaUserCount = 0;
  let upgradedUserCount = 0;

  try {
    const [canvaList, upgradeList] = await Promise.all([
      prisma.canvaInvoice.findMany({
        orderBy: { createdAt: "desc" },
        include: { usage: { select: { listingId: true } } },
      }),
      prisma.upgradeInvoice.findMany({
        orderBy: { date: "desc" },
      }),
    ]);

    canvaInvoices = canvaList.map((inv) => ({
      id: inv.id,
      userId: inv.userId,
      usageId: inv.usageId,
      amount: inv.amount,
      createdAt: inv.createdAt,
      invoiceNumber: inv.invoiceNumber,
      listingId: inv.usage?.listingId ?? null,
    }));
    canvaRevenue = canvaList.reduce((sum, inv) => sum + inv.amount, 0);
    canvaUserCount = new Set(canvaList.map((inv) => inv.userId)).size;

    let filteredUpgrades = upgradeList.map((inv) => ({
      id: inv.id,
      userId: inv.userId,
      amount: inv.amount,
      plan: inv.plan,
      date: inv.date,
    }));
    if (planFilter) {
      filteredUpgrades = filteredUpgrades.filter((inv) => inv.plan === planFilter);
    }
    if (dateFrom) {
      filteredUpgrades = filteredUpgrades.filter((inv) => new Date(inv.date) >= dateFrom);
    }
    if (dateTo) {
      const end = new Date(dateTo);
      end.setHours(23, 59, 59, 999);
      filteredUpgrades = filteredUpgrades.filter((inv) => new Date(inv.date) <= end);
    }
    upgradeInvoices = filteredUpgrades;
    upgradeRevenue = upgradeInvoices.reduce((sum, inv) => sum + inv.amount, 0);
    upgradedUserCount = new Set(upgradeInvoices.map((inv) => inv.userId)).size;
  } catch (e) {
    console.error(e);
  }

  const totalRevenue = canvaRevenue + upgradeRevenue;

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      <section className="border-b border-slate-800 bg-slate-950/80">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
          <Link href="/admin" className="text-sm font-medium text-[#C9A96E] hover:opacity-90">
            ← Back to Admin
          </Link>
          <h1 className="mt-4 text-2xl font-semibold tracking-tight text-[#C9A96E]">Income &amp; revenue</h1>
          <p className="mt-1 text-sm text-slate-400">
            Canva usage + storage plan upgrades. Invoices and paying users.
          </p>
          <AdminIncomeFilters plan={planFilter} dateFrom={params.dateFrom} dateTo={params.dateTo} />
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-wrap gap-4">
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 px-6 py-4">
            <p className="text-xs font-medium uppercase text-slate-500">Total revenue</p>
            <p className="text-2xl font-semibold text-slate-100">${totalRevenue.toFixed(2)}</p>
            <p className="text-xs text-slate-400">Canva ${canvaRevenue.toFixed(2)} + Upgrades ${upgradeRevenue.toFixed(2)}</p>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 px-6 py-4">
            <p className="text-xs font-medium uppercase text-slate-500">Canva invoices</p>
            <p className="text-2xl font-semibold text-slate-100">{canvaInvoices.length}</p>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 px-6 py-4">
            <p className="text-xs font-medium uppercase text-slate-500">Users who upgraded</p>
            <p className="text-2xl font-semibold text-emerald-400">{upgradedUserCount}</p>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 px-6 py-4">
            <p className="text-xs font-medium uppercase text-slate-500">Upgrade invoices</p>
            <p className="text-2xl font-semibold text-slate-100">{upgradeInvoices.length}</p>
          </div>
        </div>

        <h2 className="text-lg font-semibold text-slate-200">Canva invoices</h2>
        <div className="mt-4 overflow-x-auto rounded-xl border border-slate-800">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700 bg-slate-900/80">
                <th className="px-4 py-3 text-left font-medium text-slate-400">Invoice</th>
                <th className="px-4 py-3 text-left font-medium text-slate-400">User ID</th>
                <th className="px-4 py-3 text-left font-medium text-slate-400">Listing</th>
                <th className="px-4 py-3 text-right font-medium text-slate-400">Amount</th>
                <th className="px-4 py-3 text-left font-medium text-slate-400">Date</th>
              </tr>
            </thead>
            <tbody>
              {canvaInvoices.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-slate-500">
                    No Canva invoices yet.
                  </td>
                </tr>
              ) : (
                canvaInvoices.map((inv) => (
                  <tr key={inv.id} className="border-b border-slate-800/80">
                    <td className="px-4 py-3 text-slate-300">{inv.invoiceNumber ?? inv.id}</td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-400">{inv.userId}</td>
                    <td className="px-4 py-3 text-slate-400">{inv.listingId ?? "—"}</td>
                    <td className="px-4 py-3 text-right font-medium text-slate-200">${inv.amount.toFixed(2)}</td>
                    <td className="px-4 py-3 text-slate-400">
                      {new Date(inv.createdAt).toLocaleString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <h2 className="mt-8 text-lg font-semibold text-slate-200">Upgrade invoices (storage plans)</h2>
        <div className="mt-4 overflow-x-auto rounded-xl border border-slate-800">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700 bg-slate-900/80">
                <th className="px-4 py-3 text-left font-medium text-slate-400">ID</th>
                <th className="px-4 py-3 text-left font-medium text-slate-400">User ID</th>
                <th className="px-4 py-3 text-left font-medium text-slate-400">Plan</th>
                <th className="px-4 py-3 text-right font-medium text-slate-400">Amount</th>
                <th className="px-4 py-3 text-left font-medium text-slate-400">Date</th>
              </tr>
            </thead>
            <tbody>
              {upgradeInvoices.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-slate-500">
                    No upgrade invoices yet.
                  </td>
                </tr>
              ) : (
                upgradeInvoices.map((inv) => (
                  <tr key={inv.id} className="border-b border-slate-800/80">
                    <td className="px-4 py-3 font-mono text-xs text-slate-400">{inv.id}</td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-400">{inv.userId}</td>
                    <td className="px-4 py-3 text-slate-300">{inv.plan === "design-access" ? "Design Access" : inv.plan}</td>
                    <td className="px-4 py-3 text-right font-medium text-slate-200">${inv.amount.toFixed(2)}</td>
                    <td className="px-4 py-3 text-slate-400">
                      {new Date(inv.date).toLocaleString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
