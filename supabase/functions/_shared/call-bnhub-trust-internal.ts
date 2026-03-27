/**
 * Call Next.js BNHub trust internal routes. Set `LECIPM_API_BASE_URL` and `BNHUB_TRUST_CRON_SECRET` in Supabase secrets.
 */
export async function callBnhubTrustInternal(path: string, body: Record<string, unknown> = {}) {
  const base = Deno.env.get("LECIPM_API_BASE_URL") ?? Deno.env.get("NEXT_PUBLIC_APP_URL");
  const secret = Deno.env.get("BNHUB_TRUST_CRON_SECRET");
  if (!base || !secret) {
    return new Response(
      JSON.stringify({ error: "Missing LECIPM_API_BASE_URL or BNHUB_TRUST_CRON_SECRET" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
  const url = `${base.replace(/\/$/, "")}${path}`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-bnhub-trust-cron": secret,
    },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  return new Response(text, {
    status: res.status,
    headers: { "Content-Type": res.headers.get("Content-Type") ?? "application/json" },
  });
}
