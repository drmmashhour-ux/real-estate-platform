import { callBnhubGrowthInternal } from "../_shared/call-internal-api.ts";

Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("Method Not Allowed", { status: 405 });
  const body = await req.json().catch(() => ({}));
  return callBnhubGrowthInternal("/api/internal/bnhub-growth/connector-webhook-ingest", body as Record<string, unknown>);
});
