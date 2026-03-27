/**
 * Placeholder: wire to /api/internal/bnhub-marketplace/risk-hold-scan when implemented.
 * Same secrets as bnhub-daily-payout-release-scan.
 */

Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("Method Not Allowed", { status: 405 });
  return new Response(
    JSON.stringify({
      ok: true,
      message: "Placeholder — implement risk-hold scan route and point this function to it.",
    }),
    { headers: { "Content-Type": "application/json" } }
  );
});
