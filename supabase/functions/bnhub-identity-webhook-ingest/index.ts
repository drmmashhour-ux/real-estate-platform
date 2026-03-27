/** Forward Stripe Identity events to Next — configure Stripe endpoint URL to Next.js /api/webhooks/stripe/identity instead if preferred. */

Deno.serve(async () =>
  new Response(
    JSON.stringify({
      message: "Configure Stripe Identity webhooks to POST directly to your Next.js /api/webhooks/stripe/identity with signing secret.",
    }),
    { headers: { "Content-Type": "application/json" } }
  )
);
