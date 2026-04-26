import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();
import { summarizeHubGstQst, taxableRevenueByDomain } from "./finance-admin-tax.service";
import { FINANCE_HUB_DISCLAIMERS } from "./finance-admin.types";

export async function buildDraftGstQstReturnSummary() {
  const tax = await summarizeHubGstQst();
  const profile = await prisma.taxRegistrationProfile.findFirst({
    orderBy: { effectiveDate: "desc" },
  });
  return {
    disclaimer: FINANCE_HUB_DISCLAIMERS.notAdvice,
    tax,
    registrantProfile: profile,
    sections: [
      "Taxable revenue by domain (ledger-based, illustrative)",
      "Input tax on vendor bills (recoverability depends on facts — track via ledger notes)",
      "Property dispositions require transaction-specific analysis — not auto-classified",
    ],
  };
}

export async function buildTaxableRevenueByDomainReport() {
  const byDomain = await taxableRevenueByDomain();
  return { byDomain, disclaimer: FINANCE_HUB_DISCLAIMERS.notAdvice };
}

export async function buildInputTaxSummaryPlaceholder() {
  return {
    message:
      "Map vendor invoices with GST/QST lines into hub ledger entry types GST/QST with counterparty GOVERNMENT/VENDOR.",
    disclaimer: FINANCE_HUB_DISCLAIMERS.notAdvice,
  };
}
