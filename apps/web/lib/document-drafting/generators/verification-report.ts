import { prisma } from "@/lib/db";
import { renderTemplate } from "../engine";
import { validateContext, REQUIRED_BY_DOCUMENT_TYPE } from "../validators";
import { VERIFICATION_REPORT_TEMPLATE } from "../templates/verification-report";

function formatDate(d: Date): string {
  return new Date(d).toLocaleDateString("en-CA", { year: "numeric", month: "long", day: "numeric" });
}

export async function generateVerificationReportDraft(propertyIdentityId: string) {
  const identity = await prisma.propertyIdentity.findUnique({
    where: { id: propertyIdentityId },
    include: { owners: { where: { isCurrent: true } } },
  });
  if (!identity) throw new Error("Property identity not found");
  const owners = identity.owners.map((o) => ({
    ownerName: o.ownerName,
    ownerSource: o.ownerSource,
  }));
  const context: Record<string, unknown> = {
    property_address: identity.officialAddress ?? identity.normalizedAddress ?? "—",
    cadastre_number: identity.cadastreNumber ?? "—",
    municipality: identity.municipality ?? "—",
    province: identity.province ?? "—",
    verification_score: identity.verificationScore ?? "—",
    owners,
    generated_date: formatDate(new Date()),
  };
  const validation = validateContext(context, REQUIRED_BY_DOCUMENT_TYPE.verification_report);
  if (!validation.valid) throw new Error(`Missing required fields: ${validation.missing.join(", ")}`);
  const html = renderTemplate(VERIFICATION_REPORT_TEMPLATE, context);
  return { html, context, signatureFields: [] };
}
