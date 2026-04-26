import Link from "next/link";
import { cookies } from "next/headers";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();
import { requireAuthenticatedUser } from "@/lib/auth/require-session";
import { TENANT_CONTEXT_COOKIE_NAME } from "@/lib/auth/session-cookie";
import { DealFinancialCard } from "@/components/finance/DealFinancialCard";
import { getVerifiedTenantIdForUser } from "@/modules/tenancy/services/tenant-page-guard";

export default async function FinanceCommissionsPage() {
  const { userId } = await requireAuthenticatedUser();
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: { role: true },
  });
  const cookieStore = await cookies();
  const rawTenant = cookieStore.get(TENANT_CONTEXT_COOKIE_NAME)?.value;
  const tenantId = await getVerifiedTenantIdForUser(userId, user.role);

  if (rawTenant && !tenantId) {
    return (
      <div className="p-8 text-amber-200">
        Invalid workspace.{" "}
        <Link href="/dashboard/tenant" className="text-emerald-400 hover:underline">
          Select a workspace
        </Link>
      </div>
    );
  }

  if (!tenantId) {
    return (
      <div className="p-8 text-slate-200">
        <Link href="/dashboard/tenant" className="text-emerald-400 hover:underline">
          Select a workspace
        </Link>
      </div>
    );
  }

  const deals = await prisma.dealFinancial.findMany({
    where: { tenantId },
    orderBy: { updatedAt: "desc" },
    take: 50,
  });

  return (
    <div className="mx-auto max-w-4xl space-y-8 px-4 py-10 text-slate-100">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Commissions</h1>
          <p className="mt-1 text-sm text-slate-400">Deal-level financials and split workflow.</p>
        </div>
        <Link href="/dashboard/finance" className="text-sm text-emerald-400 hover:underline">
          ← Finance home
        </Link>
      </div>

      <ul className="space-y-4">
        {deals.map((d) => (
          <li key={d.id}>
            <Link href={`/dashboard/finance/commissions/${d.id}`} className="block rounded border border-white/10 bg-white/5 p-4 hover:border-emerald-500/40">
              <DealFinancialCard
                deal={{
                  id: d.id,
                  salePrice: d.salePrice,
                  commissionRate: d.commissionRate,
                  grossCommission: d.grossCommission,
                  netCommission: d.netCommission,
                  currency: d.currency,
                }}
              />
            </Link>
          </li>
        ))}
      </ul>

      {deals.length === 0 ? (
        <p className="text-sm text-slate-500">No deal financials yet. Create via the finance API or future offer/contract flows.</p>
      ) : null}
    </div>
  );
}
