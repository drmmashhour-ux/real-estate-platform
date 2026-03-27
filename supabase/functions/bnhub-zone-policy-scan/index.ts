import { callBnhubTrustInternal } from "../_shared/call-bnhub-trust-internal.ts";

Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("Method Not Allowed", { status: 405 });
  const body = await req.json().catch(() => ({}));
  return callBnhubTrustInternal("/api/internal/bnhub-trust/zone-policy-scan", body);
});
