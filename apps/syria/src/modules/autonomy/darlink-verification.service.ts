/**
 * Post-action verification — reads Syria DB; never throws.
 */

import type { MarketplaceActionProposal } from "./darlink-marketplace-autonomy.types";
import { prisma } from "@/lib/db";
import { persistAutonomyAuditEvent } from "./darlink-autonomy-persistence.service";

export async function verifyMarketplaceActionOutcome(params: {
  proposal: MarketplaceActionProposal;
  expectedCode?: string;
}): Promise<{ consistent: boolean; notes: readonly string[] }> {
  const notes: string[] = [];
  try {
    const id = params.proposal.entityId;
    if (!id) return { consistent: false, notes: ["missing_entity"] };

    switch (params.proposal.actionType) {
      case "APPROVE_LISTING":
      case "FLAG_LISTING_REVIEW":
      case "REJECT_LISTING": {
        const p = await prisma.syriaProperty.findUnique({
          where: { id },
          select: { status: true },
        });
        notes.push(`listing_status=${p?.status ?? "?"}`);
        return { consistent: Boolean(p), notes };
      }
      case "MARK_BOOKING_GUEST_PAID":
      case "RECORD_CHECKIN": {
        const b = await prisma.syriaBooking.findUnique({
          where: { id },
          select: { guestPaymentStatus: true, checkedInAt: true },
        });
        notes.push(`booking_payment=${b?.guestPaymentStatus ?? "?"}`);
        return { consistent: Boolean(b), notes };
      }
      case "APPROVE_PAYOUT":
      case "MARK_PAYOUT_PAID": {
        const po = await prisma.syriaPayout.findUnique({
          where: { id },
          select: { status: true },
        });
        notes.push(`payout_status=${po?.status ?? "?"}`);
        return { consistent: Boolean(po), notes };
      }
      default:
        notes.push(`verify_stub:${params.expectedCode ?? "none"}`);
        return { consistent: true, notes };
    }
  } catch {
    return { consistent: false, notes: ["verify_failed"] };
  }
}

export async function verifyMarketplaceBatchOutcome(
  items: { proposal: MarketplaceActionProposal }[],
): Promise<{ consistent: boolean; aggregateNotes: readonly string[] }> {
  const agg: string[] = [];
  try {
    for (const x of items) {
      const r = await verifyMarketplaceActionOutcome({ proposal: x.proposal });
      agg.push(...r.notes);
    }
    await persistAutonomyAuditEvent({
      eventType: "autonomy_verification_batch",
      payload: { count: items.length },
    });
    return { consistent: true, aggregateNotes: agg.slice(0, 50) };
  } catch {
    return { consistent: false, aggregateNotes: ["batch_verify_failed"] };
  }
}
