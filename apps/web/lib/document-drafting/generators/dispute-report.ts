import { prisma } from "@/lib/db";
import { renderTemplate } from "../engine";
import { validateContext, REQUIRED_BY_DOCUMENT_TYPE } from "../validators";
import { DISPUTE_REPORT_TEMPLATE } from "../templates/dispute-report";

function formatCents(cents: number | null | undefined): string {
  if (cents == null) return "—";
  return new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" }).format(cents / 100);
}
function formatDate(d: Date | null | undefined): string {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-CA", { year: "numeric", month: "long", day: "numeric" });
}

export async function generateDisputeReportDraft(disputeId: string) {
  const dispute = await prisma.dispute.findUnique({
    where: { id: disputeId },
    include: {
      booking: { include: { listing: true } },
    },
  });
  if (!dispute) throw new Error("Dispute not found");
  const address = [dispute.booking?.listing?.address, dispute.booking?.listing?.city].filter(Boolean).join(", ") || "—";
  const context: Record<string, unknown> = {
    dispute_id: dispute.id,
    booking_id: dispute.bookingId,
    dispute_status: dispute.status,
    claimant: dispute.claimant,
    claimant_user_id: dispute.claimantUserId,
    description: dispute.description,
    complaint_category: dispute.complaintCategory ?? "",
    listing_address: address,
    resolution_outcome: dispute.resolutionOutcome ?? "",
    refund_cents: dispute.refundCents,
    refund_amount: dispute.refundCents != null ? formatCents(dispute.refundCents) : "",
    resolution_notes: dispute.resolutionNotes ?? "",
    generated_date: formatDate(new Date()),
  };
  const validation = validateContext(context, REQUIRED_BY_DOCUMENT_TYPE.dispute_report);
  if (!validation.valid) throw new Error(`Missing required fields: ${validation.missing.join(", ")}`);
  const html = renderTemplate(DISPUTE_REPORT_TEMPLATE, context);
  return { html, context, signatureFields: [] };
}
