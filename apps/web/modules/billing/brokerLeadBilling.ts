import { randomBytes } from "crypto";
import type { PrismaClient } from "@prisma/client";
import type Stripe from "stripe";
import { getSiteBaseUrl } from "@/modules/seo/lib/siteBaseUrl";
import { getBrokerLeadUnitPrice, getOrCreateBrokerMonetizationProfile } from "./brokerPricing";

export const BROKER_BILLING_BLOCKED = "BROKER_BILLING_BLOCKED";

export function formatBrokerBillingBlockReason(reason: string): string {
  return `${BROKER_BILLING_BLOCKED}:${reason}`;
}

export function isBrokerBillingBlockedMessage(message: string): boolean {
  return message.startsWith(`${BROKER_BILLING_BLOCKED}:`);
}

export function parseBrokerBillingBlockReason(message: string): string {
  return message.slice(BROKER_BILLING_BLOCKED.length + 1).trim() || "unknown";
}

export async function countUnpaidBrokerLeads(db: PrismaClient, brokerId: string): Promise<number> {
  return db.brokerLead.count({
    where: {
      brokerId,
      billingStatus: { in: ["unpaid", "pending_checkout"] },
    },
  });
}

export async function assertBrokerCanReceiveNewLead(
  db: PrismaClient,
  brokerId: string
): Promise<{ ok: true } | { ok: false; reason: string }> {
  const profile = await getOrCreateBrokerMonetizationProfile(db, brokerId);
  if (profile.leadReceivingPaused) {
    return { ok: false, reason: "lead_receiving_paused" };
  }
  if (profile.subscriptionCoversAssignedLeads) {
    return { ok: true };
  }
  const unpaid = await countUnpaidBrokerLeads(db, brokerId);
  if (unpaid >= profile.maxUnpaidLeads) {
    return { ok: false, reason: "max_unpaid_leads" };
  }
  return { ok: true };
}

function mapPipelineToBrokerLeadStatus(pipeline: string): string {
  const p = (pipeline ?? "").toLowerCase();
  if (p === "lost") return "lost";
  if (p === "won" || p === "closed") return "closed";
  if (p === "contacted" || p === "qualified" || p === "meeting" || p === "negotiation") return "contacted";
  return "new";
}

/**
 * Ensures a `BrokerLead` exists when `Lead.introducedByBrokerId` is set.
 * Does not re-check unpaid caps (those are enforced at assignment time).
 */
export async function ensureBrokerLeadOnAssignment(db: PrismaClient, leadId: string): Promise<void> {
  const lead = await db.lead.findUnique({
    where: { id: leadId },
    select: {
      introducedByBrokerId: true,
      userId: true,
      listingId: true,
      pipelineStatus: true,
    },
  });
  if (!lead?.introducedByBrokerId) return;

  const existing = await db.brokerLead.findUnique({ where: { leadId } });
  if (existing) {
    const crmStatus = mapPipelineToBrokerLeadStatus(lead.pipelineStatus);
    if (existing.status !== crmStatus) {
      await db.brokerLead.update({ where: { id: existing.id }, data: { status: crmStatus } }).catch(() => {});
    }
    return;
  }

  const profile = await getOrCreateBrokerMonetizationProfile(db, lead.introducedByBrokerId);
  const unit = await getBrokerLeadUnitPrice(db, lead.introducedByBrokerId);
  const waived = profile.subscriptionCoversAssignedLeads;

  await db.brokerLead.create({
    data: {
      brokerId: lead.introducedByBrokerId,
      buyerId: lead.userId ?? undefined,
      listingId: lead.listingId ?? undefined,
      leadId,
      status: mapPipelineToBrokerLeadStatus(lead.pipelineStatus),
      billingStatus: waived ? "waived" : "unpaid",
      price: waived ? 0 : unit,
    },
  });
}

export type CreateBrokerCheckoutResult =
  | { ok: true; url: string; sessionId: string }
  | { ok: false; error: string };

/**
 * Stripe Checkout for a single assigned lead (pay-per-lead).
 * Metadata: brokerId, leadId, brokerLeadId, paymentType broker_assigned_lead.
 */
export async function createBrokerCheckoutSession(
  db: PrismaClient,
  stripe: Stripe,
  args: {
    brokerLeadId: string;
    payingBrokerId: string;
    successPath?: string;
    cancelPath?: string;
  }
): Promise<CreateBrokerCheckoutResult> {
  const bl = await db.brokerLead.findFirst({
    where: { id: args.brokerLeadId, brokerId: args.payingBrokerId },
    select: { id: true, leadId: true, listingId: true, billingStatus: true, price: true },
  });
  if (!bl || bl.billingStatus === "paid" || bl.billingStatus === "waived") {
    return { ok: false, error: "invalid_broker_lead" };
  }
  const amountCents = Math.round(bl.price * 100);
  if (amountCents <= 0) return { ok: false, error: "invalid_amount" };

  const base = getSiteBaseUrl();
  const successDefault = "/dashboard/broker?leadBilling=success";
  const cancelDefault = "/dashboard/broker?leadBilling=cancel";
  const meta: Record<string, string> = {
    paymentType: "broker_assigned_lead",
    userId: args.payingBrokerId,
    brokerId: args.payingBrokerId,
    leadId: bl.leadId,
    brokerLeadId: bl.id,
    ...(bl.listingId ? { listingId: bl.listingId } : {}),
  };

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: [
      {
        price_data: {
          currency: "cad",
          product_data: {
            name: "LECIPM assigned lead",
            description: `Lead ${bl.leadId.slice(0, 8)}…`,
          },
          unit_amount: amountCents,
        },
        quantity: 1,
      },
    ],
    success_url: `${base}${args.successPath ?? successDefault}`,
    cancel_url: `${base}${args.cancelPath ?? cancelDefault}`,
    metadata: meta,
    payment_intent_data: { metadata: meta },
  });

  const url = session.url;
  if (!url) return { ok: false, error: "no_checkout_url" };

  await db.brokerLead.update({
    where: { id: bl.id },
    data: { billingStatus: "pending_checkout" },
  });

  return { ok: true, url, sessionId: session.id };
}

export type CreateInvoiceCheckoutResult =
  | { ok: true; url: string; sessionId: string; brokerInvoiceId: string }
  | { ok: false; error: string };

/**
 * Rolls unpaid assigned leads into one `BrokerInvoice` and opens Stripe Checkout.
 */
export async function createBrokerInvoiceBatchCheckout(
  db: PrismaClient,
  stripe: Stripe,
  args: { brokerId: string; successPath?: string; cancelPath?: string }
): Promise<CreateInvoiceCheckoutResult> {
  const unpaid = await db.brokerLead.findMany({
    where: {
      brokerId: args.brokerId,
      billingStatus: "unpaid",
      brokerInvoiceId: null,
    },
    select: { id: true, price: true },
  });
  if (!unpaid.length) return { ok: false, error: "no_unpaid_leads" };

  const total = unpaid.reduce((s, r) => s + r.price, 0);
  const amountCents = Math.round(total * 100);
  if (amountCents <= 0) return { ok: false, error: "invalid_amount" };

  const invoice = await db.$transaction(async (tx) => {
    const inv = await tx.brokerInvoice.create({
      data: { brokerId: args.brokerId, totalAmount: total, status: "pending" },
    });
    await tx.brokerLead.updateMany({
      where: { id: { in: unpaid.map((u) => u.id) } },
      data: { brokerInvoiceId: inv.id },
    });
    return inv;
  });

  const base = getSiteBaseUrl();
  const meta: Record<string, string> = {
    paymentType: "broker_lead_invoice",
    userId: args.brokerId,
    brokerId: args.brokerId,
    brokerInvoiceId: invoice.id,
  };

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: [
      {
        price_data: {
          currency: "cad",
          product_data: {
            name: "LECIPM broker lead invoice",
            description: `${unpaid.length} assigned lead(s)`,
          },
          unit_amount: amountCents,
        },
        quantity: 1,
      },
    ],
    success_url: `${base}${args.successPath ?? "/dashboard/broker?leadBilling=invoice_success"}`,
    cancel_url: `${base}${args.cancelPath ?? "/dashboard/broker?leadBilling=invoice_cancel"}`,
    metadata: meta,
    payment_intent_data: { metadata: meta },
  });

  const url = session.url;
  if (!url) return { ok: false, error: "no_checkout_url" };

  await db.brokerInvoice.update({
    where: { id: invoice.id },
    data: { stripeSessionId: session.id },
  });

  return { ok: true, url, sessionId: session.id, brokerInvoiceId: invoice.id };
}

export async function applyBrokerAssignedLeadCheckoutSuccess(
  db: PrismaClient,
  args: {
    payingBrokerId: string;
    brokerLeadId: string;
    stripePaymentIntentId: string;
    amountCents: number;
  }
): Promise<void> {
  const amount = args.amountCents / 100;
  await db.$transaction(async (tx) => {
    const dup = await tx.brokerPayment.findUnique({
      where: { stripePaymentIntentId: args.stripePaymentIntentId },
    });
    if (dup) return;

    const bl = await tx.brokerLead.findFirst({
      where: { id: args.brokerLeadId, brokerId: args.payingBrokerId },
    });
    if (!bl || bl.billingStatus === "paid" || bl.billingStatus === "waived") return;

    await tx.brokerPayment.create({
      data: {
        brokerId: args.payingBrokerId,
        stripePaymentIntentId: args.stripePaymentIntentId,
        amount,
        status: "success",
        brokerLeadId: bl.id,
      },
    });
    await tx.brokerLead.update({
      where: { id: bl.id },
      data: { billingStatus: "paid" },
    });
  });
}

export async function applyBrokerLeadInvoiceCheckoutSuccess(
  db: PrismaClient,
  args: {
    payingBrokerId: string;
    brokerInvoiceId: string;
    stripePaymentIntentId: string;
    amountCents: number;
  }
): Promise<void> {
  const amount = args.amountCents / 100;
  await db.$transaction(async (tx) => {
    const dup = await tx.brokerPayment.findUnique({
      where: { stripePaymentIntentId: args.stripePaymentIntentId },
    });
    if (dup) return;

    const inv = await tx.brokerInvoice.findFirst({
      where: { id: args.brokerInvoiceId, brokerId: args.payingBrokerId },
      include: { leads: { select: { id: true } } },
    });
    if (!inv || inv.status === "paid") return;

    await tx.brokerPayment.create({
      data: {
        brokerId: args.payingBrokerId,
        stripePaymentIntentId: args.stripePaymentIntentId,
        amount,
        status: "success",
        brokerInvoiceId: inv.id,
      },
    });
    await tx.brokerInvoice.update({
      where: { id: inv.id },
      data: { status: "paid" },
    });
    if (inv.leads.length) {
      await tx.brokerLead.updateMany({
        where: { brokerInvoiceId: inv.id },
        data: { billingStatus: "paid" },
      });
    }
  });
}

export async function markBrokerLeadCheckoutFailed(
  db: PrismaClient,
  args: { stripePaymentIntentId: string; brokerLeadId?: string | null }
): Promise<void> {
  const brokerLeadId = args.brokerLeadId;
  if (!brokerLeadId) return;
  await db.$transaction(async (tx) => {
    const existing = await tx.brokerPayment.findUnique({
      where: { stripePaymentIntentId: args.stripePaymentIntentId },
    });
    if (existing) return;

    const bl = await tx.brokerLead.findUnique({ where: { id: brokerLeadId } });
    if (!bl || bl.billingStatus !== "pending_checkout") return;
    await tx.brokerPayment.create({
      data: {
        brokerId: bl.brokerId,
        stripePaymentIntentId: args.stripePaymentIntentId,
        amount: 0,
        status: "failed",
        brokerLeadId: bl.id,
      },
    });
    await tx.brokerLead.update({
      where: { id: bl.id },
      data: { billingStatus: "unpaid" },
    });
  });
}

/** Marketplace purchase already paid via Stripe — mirror into `BrokerLead` for admin reporting. */
/**
 * Settle one assigned lead using a pre-paid credit (no Stripe). Decrements `leadCreditsBalance`.
 */
export async function redeemBrokerLeadWithCredit(
  db: PrismaClient,
  args: { brokerLeadId: string; brokerId: string }
): Promise<{ ok: true } | { ok: false; error: string }> {
  const bl = await db.brokerLead.findFirst({
    where: { id: args.brokerLeadId, brokerId: args.brokerId },
    select: { id: true, billingStatus: true, price: true },
  });
  if (!bl || bl.billingStatus === "paid" || bl.billingStatus === "waived") {
    return { ok: false, error: "invalid_broker_lead" };
  }

  const profile = await db.brokerMonetizationProfile.findUnique({
    where: { brokerId: args.brokerId },
    select: { leadCreditsBalance: true },
  });
  if (!profile || profile.leadCreditsBalance < 1) {
    return { ok: false, error: "insufficient_credits" };
  }

  const syntheticPi = `credit_${randomBytes(18).toString("hex")}`;

  try {
    await db.$transaction(async (tx) => {
      const p = await tx.brokerMonetizationProfile.findUnique({
        where: { brokerId: args.brokerId },
        select: { leadCreditsBalance: true },
      });
      if (!p || p.leadCreditsBalance < 1) {
        throw new Error("insufficient_credits");
      }
      const row = await tx.brokerLead.findFirst({
        where: { id: args.brokerLeadId, brokerId: args.brokerId },
        select: { id: true, billingStatus: true },
      });
      if (!row || row.billingStatus === "paid" || row.billingStatus === "waived") {
        throw new Error("invalid_broker_lead");
      }
      await tx.brokerMonetizationProfile.update({
        where: { brokerId: args.brokerId },
        data: { leadCreditsBalance: { decrement: 1 } },
      });
      await tx.brokerPayment.create({
        data: {
          brokerId: args.brokerId,
          stripePaymentIntentId: syntheticPi,
          amount: bl.price,
          status: "credit_redeemed",
          brokerLeadId: row.id,
        },
      });
      await tx.brokerLead.update({
        where: { id: row.id },
        data: { billingStatus: "paid" },
      });
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "redeem_failed";
    if (msg === "insufficient_credits" || msg === "invalid_broker_lead") {
      return { ok: false, error: msg };
    }
    return { ok: false, error: "redeem_failed" };
  }

  return { ok: true };
}

export async function upsertMarketplacePaidBrokerLead(
  db: PrismaClient,
  args: { leadId: string; brokerId: string; priceCents: number }
): Promise<void> {
  const lead = await db.lead.findUnique({
    where: { id: args.leadId },
    select: { userId: true, listingId: true, pipelineStatus: true },
  });
  const price = args.priceCents / 100;
  const status = mapPipelineToBrokerLeadStatus(lead?.pipelineStatus ?? "new");

  await db.brokerLead.upsert({
    where: { leadId: args.leadId },
    create: {
      brokerId: args.brokerId,
      buyerId: lead?.userId ?? undefined,
      listingId: lead?.listingId ?? undefined,
      leadId: args.leadId,
      status,
      billingStatus: "paid",
      price,
    },
    update: {
      brokerId: args.brokerId,
      billingStatus: "paid",
      price,
      status,
    },
  });
}
