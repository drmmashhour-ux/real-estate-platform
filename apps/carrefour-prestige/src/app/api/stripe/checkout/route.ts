import { getStripe } from "@/lib/stripe";
import { NextResponse } from "next/server";
import { z } from "zod";

const bodySchema = z.object({
  plan: z.enum(["BROKER_PREMIUM", "INVESTOR_PREMIUM"]),
  priceId: z.string().min(1),
  customerEmail: z.string().email(),
});

export async function POST(req: Request) {
  const stripe = getStripe();
  if (!stripe) {
    return NextResponse.json({ error: "Stripe is not configured" }, { status: 503 });
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3040";

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer_email: parsed.data.customerEmail,
    line_items: [{ price: parsed.data.priceId, quantity: 1 }],
    success_url: `${baseUrl}/dashboard?checkout=success`,
    cancel_url: `${baseUrl}/dashboard?checkout=cancel`,
    metadata: { plan: parsed.data.plan },
  });

  return NextResponse.json({ url: session.url });
}
