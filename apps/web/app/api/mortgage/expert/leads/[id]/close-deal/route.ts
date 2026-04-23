import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@repo/db";
import { appendLeadTimelineEvent } from "@/lib/leads/timeline-helpers";
import { normalizePipelineStage } from "@/lib/leads/pipeline-stage";
import { splitMortgageCommission } from "@/modules/mortgage/services/commission";
import { requireMortgageExpertWithTerms } from "@/modules/mortgage/services/expert-guard";
import { getStripe, isStripeConfigured } from "@/lib/stripe";
import { logError } from "@/lib/logger";
import { sendMortgageBillingEmail } from "@/lib/email/mortgage-billing-emails";

export const dynamic = "force-dynamic";

/**
 * Expert confirms closed deal: records commission split + sets lead to closed.
 * Also creates payout record, commission invoice row, and optional Stripe Connect transfer.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireMortgageExpertWithTerms();
  if ("error" in session) return session.error;

  const { id: leadId } = await params;
  const body = await req.json().catch(() => ({}));
  const dealAmountRaw = body?.dealAmount ?? body?.deal_amount;
  const dealAmount =
    typeof dealAmountRaw === "number"
      ? Math.round(dealAmountRaw)
      : typeof dealAmountRaw === "string"
        ? Math.round(Number.parseFloat(dealAmountRaw))
        : NaN;
  const confirmed = body?.confirmed === true;
  if (!confirmed) {
    return NextResponse.json({ error: "confirmed must be true" }, { status: 400 });
  }
  if (!Number.isFinite(dealAmount) || dealAmount <= 0) {
    return NextResponse.json({ error: "Valid deal amount required (whole dollars)" }, { status: 400 });
  }

  const lead = await prisma.lead.findUnique({
    where: { id: leadId },
    select: {
      id: true,
      assignedExpertId: true,
      leadType: true,
      pipelineStatus: true,
      serviceCommissionRate: true,
    },
  });
  if (!lead || lead.assignedExpertId !== session.expert.id || lead.leadType !== "mortgage") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const existing = await prisma.mortgageDeal.findUnique({ where: { leadId } });
  if (existing) {
    return NextResponse.json({ error: "Deal already recorded for this lead" }, { status: 409 });
  }

  const rate =
    lead.serviceCommissionRate != null && Number.isFinite(lead.serviceCommissionRate)
      ? Math.min(Math.max(lead.serviceCommissionRate, 0), 1)
      : (session.expert.commissionRate ?? 0.3);
  const { platformShare, expertShare } = splitMortgageCommission(dealAmount, rate);

  /** Align with broker CRM: closed mortgage deals are pipeline `won`. */
  const wonPipeline = "won";
  const reviewToken = randomUUID();
  const platformFeeCents = platformShare * 100;
  const expertAmountCents = expertShare * 100;

  const { createdDeal, invoiceId } = await prisma.$transaction(async (tx) => {
    const deal = await tx.mortgageDeal.create({
      data: {
        leadId,
        expertId: session.expert.id,
        dealAmount,
        platformShare,
        expertShare,
        commissionRate: rate,
        status: "closed",
        reviewToken,
      },
    });
    await tx.lead.update({
      where: { id: leadId },
      data: {
        pipelineStatus: wonPipeline,
        pipelineStage: normalizePipelineStage(wonPipeline),
        status: wonPipeline,
        dealClosedAt: new Date(),
        wonAt: new Date(),
        finalSalePrice: dealAmount,
        finalCommission: platformShare,
        dealValue: dealAmount,
        commissionEstimate: platformShare,
      },
    });
    await tx.mortgageExpert.update({
      where: { id: session.expert.id },
      data: {
        totalDeals: { increment: 1 },
        totalRevenue: { increment: dealAmount },
      },
    });

    await tx.expertPayoutRecord.create({
      data: {
        expertId: session.expert.id,
        mortgageDealId: deal.id,
        expertAmountCents,
        platformFeeCents,
        status: "pending",
      },
    });

    const inv = await tx.expertInvoice.create({
      data: {
        expertId: session.expert.id,
        type: "commission",
        amountCents: platformFeeCents,
        currency: "cad",
        description: `Platform commission (${Math.round(rate * 100)}%) — mortgage deal`,
        metadata: {
          leadId,
          mortgageDealId: deal.id,
          dealAmount,
          expertShare,
          platformShare,
        } as object,
      },
    });

    return { createdDeal: deal, invoiceId: inv.id };
  });

  const transferEnabled = process.env.STRIPE_ENABLE_MORTGAGE_EXPERT_TRANSFERS?.trim() === "true";
  if (transferEnabled && isStripeConfigured() && expertAmountCents > 0) {
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { stripeAccountId: true, stripeOnboardingComplete: true },
    });
    const destination = user?.stripeAccountId;
    if (destination && user.stripeOnboardingComplete) {
      const stripe = getStripe();
      if (stripe) {
        try {
          const tr = await stripe.transfers.create({
            amount: expertAmountCents,
            currency: "cad",
            destination,
            metadata: {
              mortgageDealId: createdDeal.id,
              expertId: session.expert.id,
            },
          });
          await prisma.expertPayoutRecord.update({
            where: { mortgageDealId: createdDeal.id },
            data: { status: "transferred", stripeTransferId: tr.id },
          });
        } catch (e) {
          logError("Mortgage expert Stripe transfer failed", e);
        }
      }
    }
  }

  await appendLeadTimelineEvent(leadId, "mortgage_deal_closed", {
    expertId: session.expert.id,
    dealAmount,
    platformShare,
    expertShare,
    commissionRate: rate,
  });

  void sendMortgageBillingEmail({
    expertId: session.expert.id,
    kind: "commission_invoice",
    extra: { invoiceId },
  });

  return NextResponse.json({
    ok: true,
    deal: { dealAmount, platformShare, expertShare, commissionRate: rate },
    reviewUrl: `${process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ?? ""}/mortgage/review?t=${reviewToken}`,
    invoiceId,
  });
}
