import { prisma } from "@/lib/db";
import { renderTemplate } from "../engine";
import { validateContext, REQUIRED_BY_DOCUMENT_TYPE } from "../validators";
import { RENTAL_AGREEMENT_TEMPLATE } from "../templates/rental-agreement";

function formatDate(d: Date | null | undefined): string {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-CA", { year: "numeric", month: "long", day: "numeric" });
}

export async function generateRentalAgreementDraft(params: {
  propertyAddress: string;
  landlordName: string;
  landlordEmail: string;
  tenantName: string;
  tenantEmail: string;
  rentAmountCents: number;
  startDate: Date;
  endDate: Date;
}) {
  const formatCurrency = (cents: number) =>
    new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" }).format(cents / 100);
  const context: Record<string, unknown> = {
    property_address: params.propertyAddress,
    landlord_name: params.landlordName,
    landlord_email: params.landlordEmail,
    tenant_name: params.tenantName,
    tenant_email: params.tenantEmail,
    rent_amount: formatCurrency(params.rentAmountCents),
    start_date: formatDate(params.startDate),
    end_date: formatDate(params.endDate),
    generated_date: formatDate(new Date()),
  };
  const validation = validateContext(context, REQUIRED_BY_DOCUMENT_TYPE.rental_agreement);
  if (!validation.valid) throw new Error(`Missing required fields: ${validation.missing.join(", ")}`);
  const html = renderTemplate(RENTAL_AGREEMENT_TEMPLATE, context);
  return {
    html,
    context,
    signatureFields: [
      { signerRole: "landlord", signerName: params.landlordName, signerEmail: params.landlordEmail },
      { signerRole: "tenant", signerName: params.tenantName, signerEmail: params.tenantEmail },
    ],
  };
}
