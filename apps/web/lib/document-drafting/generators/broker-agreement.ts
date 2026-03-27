import { prisma } from "@/lib/db";
import { renderTemplate } from "../engine";
import { validateContext, REQUIRED_BY_DOCUMENT_TYPE } from "../validators";
import { BROKER_LISTING_AGREEMENT_TEMPLATE } from "../templates/broker-listing-agreement";

function formatDate(d: Date | null | undefined): string {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-CA", { year: "numeric", month: "long", day: "numeric" });
}

export async function generateBrokerAgreementDraft(params: {
  propertyIdentityId: string;
  listingType?: string;
  startDate: Date;
  endDate: Date;
}) {
  const identity = await prisma.propertyIdentity.findUnique({
    where: { id: params.propertyIdentityId },
    include: {
      owners: { where: { isCurrent: true }, take: 1 },
      listingAuthorities: {
        where: { status: "ACTIVE" },
        take: 1,
        include: { brokerIdentity: true, ownerIdentity: true },
      },
    },
  });
  if (!identity) throw new Error("Property identity not found");
  const auth = identity.listingAuthorities[0];
  const broker = auth?.brokerIdentity;
  const ownerIdentity = auth?.ownerIdentity;
  const ownerRecord = identity.owners[0];
  const ownerName =
    ownerIdentity?.legalName ?? ownerRecord?.ownerName ?? "—";
  const context: Record<string, unknown> = {
    property_address: identity.officialAddress ?? identity.normalizedAddress ?? "—",
    owner_name: ownerName,
    broker_name: broker?.legalName ?? "—",
    broker_license: broker?.licenseNumber ?? "—",
    brokerage_name: broker?.brokerageName ?? "—",
    listing_type: params.listingType ?? "Sale",
    start_date: formatDate(params.startDate),
    end_date: formatDate(params.endDate),
    generated_date: formatDate(new Date()),
  };
  const validation = validateContext(context, REQUIRED_BY_DOCUMENT_TYPE.broker_agreement);
  if (!validation.valid) throw new Error(`Missing required fields: ${validation.missing.join(", ")}`);
  const html = renderTemplate(BROKER_LISTING_AGREEMENT_TEMPLATE, context);
  return {
    html,
    context,
    signatureFields: [
      { signerRole: "owner", signerName: String(context.owner_name), signerEmail: "" },
      { signerRole: "broker", signerName: String(context.broker_name), signerEmail: "" },
    ],
  };
}
