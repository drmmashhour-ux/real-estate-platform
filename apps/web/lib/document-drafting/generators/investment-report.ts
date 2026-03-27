import { prisma } from "@/lib/db";
import { renderTemplate } from "../engine";
import { validateContext, REQUIRED_BY_DOCUMENT_TYPE } from "../validators";
import { INVESTMENT_REPORT_TEMPLATE } from "../templates/investment-report";

function formatCents(cents: number | null | undefined): string {
  if (cents == null) return "—";
  return new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" }).format(cents / 100);
}
function formatDate(d: Date): string {
  return new Date(d).toLocaleDateString("en-CA", { year: "numeric", month: "long", day: "numeric" });
}

export async function generateInvestmentReportDraft(propertyIdentityId: string) {
  const identity = await prisma.propertyIdentity.findUnique({
    where: { id: propertyIdentityId },
    include: {
      marketInvestmentScores: { orderBy: { createdAt: "desc" }, take: 1 },
      propertyValuations: { orderBy: { createdAt: "desc" }, take: 1 },
    },
  });
  if (!identity) throw new Error("Property identity not found");
  const valuation = identity.propertyValuations[0];
  const score = identity.marketInvestmentScores[0];
  const context: Record<string, unknown> = {
    property_address: identity.officialAddress ?? identity.normalizedAddress ?? "—",
    property_uid: identity.propertyUid ?? "—",
    estimated_value: valuation
      ? formatCents(valuation.estimatedValue ?? valuation.valueMax ?? valuation.valueMin)
      : "—",
    monthly_rent_estimate: valuation?.monthlyRentEstimate != null ? formatCents(valuation.monthlyRentEstimate) : "",
    investment_score: score?.investmentScore ?? identity.verificationScore ?? "",
    gross_yield_estimate: valuation?.grossYieldEstimate ?? "",
    generated_date: formatDate(new Date()),
  };
  const validation = validateContext(context, REQUIRED_BY_DOCUMENT_TYPE.investment_report);
  if (!validation.valid) throw new Error(`Missing required fields: ${validation.missing.join(", ")}`);
  const html = renderTemplate(INVESTMENT_REPORT_TEMPLATE, context);
  return { html, context, signatureFields: [] };
}
