/**
 * Calls Next.js internal cron — set LECIPM_API_BASE_URL + BNHUB_MARKETPLACE_CRON_SECRET in Supabase secrets.
 */
const CRON_HEADER = "x-bnhub-marketplace-cron";

Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("Method Not Allowed", { status: 405 });
  const base = Deno.env.get("LECIPM_API_BASE_URL") ?? Deno.env.get("NEXT_PUBLIC_APP_URL");
  const secret = Deno.env.get("BNHUB_MARKETPLACE_CRON_SECRET");
  if (!base || !secret) {
    return new Response(
      JSON.stringify({ error: "Missing LECIPM_API_BASE_URL or BNHUB_MARKETPLACE_CRON_SECRET" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
  const url = `${base.replace(/\/$/, "")}/api/internal/bnhub-marketplace/daily-payout-scan`;
  const res = await fetch(url, {
    method: "POST",
    headers: { [CRON_HEADER]: secret },
  });
  const text = await res.text();
  return new Response(text, {
    status: res.status,
    headers: { "Content-Type": res.headers.get("Content-Type") ?? "application/json" },
  });
});
