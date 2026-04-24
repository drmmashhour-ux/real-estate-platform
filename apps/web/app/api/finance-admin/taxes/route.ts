import { NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@repo/db";
import { canAccessFinanceAdminHub } from "@/lib/admin/finance-hub-access";
import {
  buildDraftGstQstReturnSummary,
  buildInputTaxSummaryPlaceholder,
  buildTaxableRevenueByDomainReport,
} from "@/modules/finance-admin/finance-admin-reporting.service";

export const dynamic = "force-dynamic";

export async function GET() {
  const userId = await getGuestId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  if (!canAccessFinanceAdminHub(user?.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const [draftReturn, byDomain, inputTax, profile] = await Promise.all([
    buildDraftGstQstReturnSummary(),
    buildTaxableRevenueByDomainReport(),
    buildInputTaxSummaryPlaceholder(),
    prisma.taxRegistrationProfile.findFirst({ orderBy: { effectiveDate: "desc" } }),
  ]);

  return NextResponse.json({
    draftReturn,
    taxableRevenueByDomain: byDomain,
    inputTax,
    taxRegistrationProfile: profile,
    sections: {
      commissions: "Tag commission lines as COMMISSION with GST/QST splits when taxable.",
      platformInvoices: "PLATFORM domain — subscription / SaaS style revenue per facts.",
      vendorBills: "Record input taxes via counterparty VENDOR / GOVERNMENT as applicable.",
    },
  });
}
