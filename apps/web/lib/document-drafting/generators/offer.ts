import { prisma } from "@/lib/db";
import { renderTemplate } from "../engine";
import { validateContext, REQUIRED_BY_DOCUMENT_TYPE } from "../validators";
import { OFFER_TO_PURCHASE_TEMPLATE } from "../templates/offer-to-purchase";

function formatCents(cents: number | null | undefined): string {
  if (cents == null) return "—";
  return new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" }).format(cents / 100);
}
function formatDate(d: Date | null | undefined): string {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-CA", { year: "numeric", month: "long", day: "numeric" });
}

export async function generateOfferDraft(transactionId: string, generatedBy: string) {
  const tx = await prisma.realEstateTransaction.findUnique({
    where: { id: transactionId },
    include: {
      propertyIdentity: true,
      buyer: { select: { id: true, name: true, email: true } },
      seller: { select: { id: true, name: true, email: true } },
      broker: { select: { id: true, name: true, email: true } },
    },
  });
  if (!tx) throw new Error("Transaction not found");
  const propertyAddress =
    tx.propertyIdentity?.normalizedAddress ?? tx.propertyIdentity?.officialAddress ?? "—";
  const context: Record<string, unknown> = {
    property_address: propertyAddress,
    cadastre_number: tx.propertyIdentity?.cadastreNumber ?? "",
    buyer_name: tx.buyer.name ?? tx.buyer.email ?? "—",
    buyer_email: tx.buyer.email ?? "—",
    seller_name: tx.seller.name ?? tx.seller.email ?? "—",
    seller_email: tx.seller.email ?? "—",
    broker_name: tx.broker?.name ?? tx.broker?.email ?? "",
    broker_email: tx.broker?.email ?? "",
    offer_price: formatCents(tx.offerPrice),
    closing_date: "",
    generated_date: formatDate(new Date()),
  };
  const validation = validateContext(context, REQUIRED_BY_DOCUMENT_TYPE.offer);
  if (!validation.valid) throw new Error(`Missing required fields: ${validation.missing.join(", ")}`);
  const html = renderTemplate(OFFER_TO_PURCHASE_TEMPLATE, context);
  return {
    html,
    context,
    signatureFields: [
      { signerRole: "buyer", signerName: String(context.buyer_name), signerEmail: String(context.buyer_email) },
      { signerRole: "seller", signerName: String(context.seller_name), signerEmail: String(context.seller_email) },
      ...(context.broker_name ? [{ signerRole: "broker", signerName: String(context.broker_name), signerEmail: String(context.broker_email || "") }] : []),
    ],
  };
}
