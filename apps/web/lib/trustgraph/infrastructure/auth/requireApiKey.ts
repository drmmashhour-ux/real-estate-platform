import { trustgraphJsonError } from "@/lib/trustgraph/infrastructure/auth/http";
import { verifyApiKey } from "@/lib/trustgraph/infrastructure/services/apiKeyService";
import { checkRateLimit } from "@/lib/trustgraph/infrastructure/services/rateLimitService";
import { isTrustGraphExternalApiEnabled, isTrustGraphEnabled } from "@/lib/trustgraph/feature-flags";

function extractApiKey(request: Request): string | null {
  const h = request.headers.get("x-api-key") ?? request.headers.get("X-API-Key");
  if (h?.trim()) return h.trim();
  const auth = request.headers.get("authorization");
  if (auth?.toLowerCase().startsWith("bearer ")) {
    return auth.slice(7).trim();
  }
  return null;
}

export async function requirePartnerApiKey(
  request: Request
): Promise<{ workspaceId: string; keyId: string } | Response> {
  if (!isTrustGraphEnabled() || !isTrustGraphExternalApiEnabled()) {
    return trustgraphJsonError("External API disabled", 503);
  }
  const plain = extractApiKey(request);
  if (!plain) return trustgraphJsonError("API key required", 401);

  const verified = await verifyApiKey(plain);
  if (!verified) return trustgraphJsonError("Invalid API key", 403);

  const rl = checkRateLimit(verified.keyId, verified.rateLimitPerMinute);
  if (!rl.allowed) {
    return new Response(JSON.stringify({ error: "Rate limit exceeded", retryAfterSec: rl.retryAfterSec }), {
      status: 429,
      headers: { "Content-Type": "application/json", ...(rl.retryAfterSec ? { "Retry-After": String(rl.retryAfterSec) } : {}) },
    });
  }

  return { workspaceId: verified.workspaceId, keyId: verified.keyId };
}
