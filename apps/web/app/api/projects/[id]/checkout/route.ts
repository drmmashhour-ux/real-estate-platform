import Stripe from "stripe";
import { NextResponse } from "next/server";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();
import { getStripe, isStripeConfigured } from "@/lib/stripe";
import {
  getSubscriptionPriceCentsAsync,
  getSubscriptionPremiumPriceCentsAsync,
  getPremiumOneTimeCentsAsync,
  getLeadPriceCentsAsync,
} from "@/lib/projects-pricing";
import { logError } from "@/lib/logger";
import { getPublicAppUrl } from "@/lib/config/public-app-url";

export const dynamic = "force-dynamic";

const baseUrl = getPublicAppUrl();

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const stripe = getStripe();
  if (!stripe || !isStripeConfigured()) {
    return NextResponse.json(
      { error: "Stripe is not configured" },
      { status: 503 }
    );
  }

  try {
    const { id: projectId } = await params;
    const body = await req.json().catch(() => ({}));
    const type = body.type as string; // subscription | premium | lead
    const leadId = body.leadId as string | undefined;

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: { subscription: true },
    });
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const successUrl = `${baseUrl}/dashboard/projects/${projectId}?checkout=success`;
    const cancelUrl = `${baseUrl}/dashboard/projects/${projectId}?checkout=cancel`;

    if (type === "lead" && leadId) {
      const amountCents = await getLeadPriceCentsAsync();
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: [
          {
            price_data: {
              currency: "usd",
              product_data: {
                name: `Unlock lead – ${project.name}`,
                description: "One-time payment to unlock contact details for this lead",
              },
              unit_amount: amountCents,
            },
            quantity: 1,
          },
        ],
        mode: "payment",
        success_url: `${successUrl}&leadId=${leadId}`,
        cancel_url: cancelUrl,
        metadata: { projectId, leadId, type: "project_lead" },
      });
      return NextResponse.json({ url: session.url });
    }

    if (type === "premium") {
      const amountCents = await getPremiumOneTimeCentsAsync();
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: [
          {
            price_data: {
              currency: "usd",
              product_data: {
                name: `Premium – ${project.name}`,
                description: "One-time premium upgrade for unlimited leads",
              },
              unit_amount: amountCents,
            },
            quantity: 1,
          },
        ],
        mode: "payment",
        success_url: successUrl,
        cancel_url: cancelUrl,
        metadata: { projectId, type: "project_premium" },
      });
      return NextResponse.json({ url: session.url });
    }

    if (type === "subscription" || type === "basic") {
      const amountCents = await getSubscriptionPriceCentsAsync();
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: [
          {
            price_data: {
              currency: "usd",
              product_data: {
                name: `Subscription Basic – ${project.name}`,
                description: "Monthly subscription for lead delivery",
              },
              unit_amount: amountCents,
              recurring: { interval: "month" },
            },
            quantity: 1,
          },
        ],
        mode: "subscription",
        success_url: successUrl,
        cancel_url: cancelUrl,
        metadata: { projectId, type: "project_subscription", plan: "basic" },
      });
      return NextResponse.json({ url: session.url });
    }

    if (type === "subscription_premium") {
      const amountCents = await getSubscriptionPremiumPriceCentsAsync();
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: [
          {
            price_data: {
              currency: "usd",
              product_data: {
                name: `Subscription Premium – ${project.name}`,
                description: "Monthly premium subscription",
              },
              unit_amount: amountCents,
              recurring: { interval: "month" },
            },
            quantity: 1,
          },
        ],
        mode: "subscription",
        success_url: successUrl,
        cancel_url: cancelUrl,
        metadata: { projectId, type: "project_subscription", plan: "premium" },
      });
      return NextResponse.json({ url: session.url });
    }

    return NextResponse.json(
      { error: "Invalid type. Use subscription, premium, or lead (with leadId)" },
      { status: 400 }
    );
  } catch (e) {
    logError("POST /api/projects/[id]/checkout", e);
    return NextResponse.json({ error: "Checkout failed" }, { status: 500 });
  }
}
