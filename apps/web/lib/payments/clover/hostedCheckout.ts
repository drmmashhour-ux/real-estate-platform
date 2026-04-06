export type CloverHostedCheckoutResult =
  | { ok: true; href: string; checkoutSessionId: string }
  | { ok: false; error: string };

/**
 * Clover Hosted Checkout — POST `/invoicingcheckoutservice/v1/checkouts`.
 * @see https://docs.clover.com/dev/docs/creating-a-hosted-checkout-session
 */
export async function createCloverHostedCheckoutSession(args: {
  amountCents: number;
  currency: string;
  description: string;
  customerEmail?: string;
  successUrl: string;
  failureUrl: string;
}): Promise<CloverHostedCheckoutResult> {
  const merchantId = process.env.CLOVER_MERCHANT_ID?.trim();
  const token = process.env.CLOVER_PRIVATE_TOKEN?.trim();
  const base =
    process.env.CLOVER_API_BASE_URL?.trim() ||
    (process.env.CLOVER_SANDBOX === "1" ? "https://apisandbox.dev.clover.com" : "https://api.clover.com");

  if (!merchantId || !token) {
    return { ok: false, error: "CLOVER_MERCHANT_ID and CLOVER_PRIVATE_TOKEN are required for Hosted Checkout" };
  }

  const authorization = token.toLowerCase().startsWith("bearer ") ? token : `Bearer ${token}`;

  const body = {
    customer: {
      email: args.customerEmail?.trim() || "guest@checkout.local",
      firstName: "Guest",
      lastName: "Payment",
    },
    redirectUrls: {
      success: args.successUrl,
      failure: args.failureUrl,
    },
    shoppingCart: {
      lineItems: [
        {
          name: (args.description || "Payment").slice(0, 120),
          price: args.amountCents,
          unitQty: 1,
          note: "LECIPM orchestration",
        },
      ],
    },
  };

  const url = `${base.replace(/\/$/, "")}/invoicingcheckoutservice/v1/checkouts`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      accept: "application/json",
      "content-type": "application/json",
      "X-Clover-Merchant-Id": merchantId,
      authorization,
    },
    body: JSON.stringify(body),
  });

  const json = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  if (!res.ok) {
    const msg =
      typeof json.message === "string"
        ? json.message
        : typeof json.error === "string"
          ? json.error
          : `Clover HTTP ${res.status}`;
    return { ok: false, error: msg };
  }

  const href = typeof json.href === "string" ? json.href : null;
  const checkoutSessionIdRaw = json.checkoutSessionId;
  const checkoutSessionId =
    typeof checkoutSessionIdRaw === "string"
      ? checkoutSessionIdRaw
      : checkoutSessionIdRaw != null
        ? String(checkoutSessionIdRaw)
        : null;

  if (!href || !checkoutSessionId) {
    return { ok: false, error: "Clover checkout response missing href or checkoutSessionId" };
  }

  return { ok: true, href, checkoutSessionId };
}
