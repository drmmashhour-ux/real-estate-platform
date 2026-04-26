import Link from "next/link";
import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();
import { requireAuthenticatedUser } from "@/lib/auth/require-session";
import { TENANT_CONTEXT_COOKIE_NAME } from "@/lib/auth/session-cookie";
import { DealFinancialCard } from "@/components/finance/DealFinancialCard";
import { CommissionSplitTable } from "@/components/finance/CommissionSplitTable";
import { getVerifiedTenantIdForUser } from "@/modules/tenancy/services/tenant-page-guard";

export default async function FinanceCommissionDetailPage(props: { params: Promise<{ id: string }> }) {
  const { userId } = await requireAuthenticatedUser();
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: { role: true },
  });
  const { id } = await props.params;
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

  const deal = await prisma.dealFinancial.findFirst({
    where: { id, tenantId },
    include: { commissionSplits: true },
  });
  if (!deal) notFound();

  return (
    <div className="mx-auto max-w-3xl space-y-8 px-4 py-10 text-slate-100">
      <Link href="/dashboard/finance/commissions" className="text-sm text-emerald-400 hover:underline">
        ← All commissions
      </Link>

      <DealFinancialCard
        deal={{
          id: deal.id,
          salePrice: deal.salePrice,
          commissionRate: deal.commissionRate,
          grossCommission: deal.grossCommission,
          netCommission: deal.netCommission,
          currency: deal.currency,
        }}
      />

      <section>
        <h2 className="mb-3 text-lg font-medium">Splits</h2>
        <CommissionSplitTable
          splits={deal.commissionSplits.map((s) => ({
            id: s.id,
            roleLabel: s.roleLabel,
            percent: s.percent,
            amount: s.amount,
            status: s.status,
          }))}
        />
      </section>
    </div>
  );
}
