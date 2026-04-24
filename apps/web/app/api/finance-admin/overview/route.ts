import { NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@repo/db";
import { canAccessFinanceAdminHub } from "@/lib/admin/finance-hub-access";
import { ensureHubFinanceAccounts, listRecentHubLedgerEntries } from "@/modules/finance-admin/finance-admin-ledger.service";
import { summarizeHubGstQst } from "@/modules/finance-admin/finance-admin-tax.service";
import { hubReconciliationStatus } from "@/modules/finance-admin/finance-admin-reconciliation.service";
import { describeCompliantMoneyFlow } from "@/modules/finance-admin/finance-admin-orchestration.service";
import { logFinanceAdminTagged } from "@/lib/server/launch-logger";

export const dynamic = "force-dynamic";

export async function GET() {
  const userId = await getGuestId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  if (!canAccessFinanceAdminHub(user?.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await ensureHubFinanceAccounts();

  const [entries, tax, obligations, recon, spvs] = await Promise.all([
    listRecentHubLedgerEntries(200),
    summarizeHubGstQst(),
    prisma.regulatoryObligation.findMany({
      orderBy: { dueDate: "asc" },
      take: 50,
    }),
    hubReconciliationStatus(),
    prisma.amfSpv.findMany({
      take: 20,
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        privateExemptDealMode: true,
        exemptionPath: true,
        capitalDealId: true,
      },
    }),
  ]);

  const in14 = new Date(Date.now() + 14 * 86400000);
  const dueSoon = obligations.filter((o) => o.dueDate <= in14 && o.status !== "PAID" && o.status !== "FILED");
  if (dueSoon.length > 0) {
    logFinanceAdminTagged.warn("obligation_due_flagged", {
      count: dueSoon.length,
      obligationIds: dueSoon.map((o) => o.id),
    });
  }

  const byDomain: Record<string, number> = { BROKERAGE: 0, PLATFORM: 0, INVESTMENT: 0 };
  for (const e of entries) {
    byDomain[e.domain] = (byDomain[e.domain] ?? 0) + Number(e.amount);
  }

  return NextResponse.json({
    cashSummaryByDomain: Object.fromEntries(
      Object.entries(byDomain).map(([k, v]) => [k, { net: v.toFixed(2), inflow: "", outflow: "" }]),
    ),
    taxSummary: {
      gstCollected: tax.gstCollected,
      qstCollected: tax.qstCollected,
      gstPaid: tax.gstPaid,
      qstPaid: tax.qstPaid,
      netGst: tax.netGst,
      netQst: tax.netQst,
      filingNote: "Draft figures from hub ledger only — reconcile with accounting system before filing.",
    },
    obligationsDueSoon: dueSoon.map((o) => ({
      id: o.id,
      authority: o.authority,
      obligationType: o.obligationType,
      dueDate: o.dueDate.toISOString(),
      status: o.status,
      amountEstimate: o.amountEstimate ? o.amountEstimate.toString() : null,
    })),
    obligations,
    reconciliation: recon,
    moneyFlow: describeCompliantMoneyFlow(),
    recentLedger: entries.slice(0, 30),
    spvs,
    alignmentNote: "Domains: BROKERAGE / PLATFORM / INVESTMENT must remain separated in ledger tagging.",
  });
}
