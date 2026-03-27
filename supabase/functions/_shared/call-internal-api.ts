/**
 * Call LECIPM Next.js internal automation routes (server-only secret).
 * Set `LECIPM_API_BASE_URL` (e.g. https://app.example.com) and `BNHUB_GROWTH_CRON_SECRET` in Supabase Function secrets.
 */
export async function callBnhubGrowthInternal(path: string, body: Record<string, unknown> = {}) {
  const base = Deno.env.get("LECIPM_API_BASE_URL") ?? Deno.env.get("NEXT_PUBLIC_APP_URL");
  const secret = Deno.env.get("BNHUB_GROWTH_CRON_SECRET");
  if (!base || !secret) {
    return new Response(
      JSON.stringify({
        error: "Missing LECIPM_API_BASE_URL or BNHUB_GROWTH_CRON_SECRET in function secrets",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
  const url = `${base.replace(/\/$/, "")}${path}`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-bnhub-growth-secret": secret,
    },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  return new Response(text, {
    status: res.status,
    headers: { "Content-Type": res.headers.get("Content-Type") ?? "application/json" },
  });
}
