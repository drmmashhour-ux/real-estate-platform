import { checkRateLimit, getRateLimitHeaders } from "@/lib/rate-limit";
import { insertBnhubEvent } from "@/lib/bnhub/growth-supabase";
import { logError } from "@/lib/logger";

export const dynamic = "force-dynamic";

const ALLOWED = new Set([
  "app_open",
  "view_property",
  "create_booking",
  "start_checkout",
  "payment_success",
  "search_query",
  /** Mobile loaded checkout quote (itemized fees + upsells). */
  "checkout_quote_view",
  /** Guest toggled an upsell before paying. */
  "upsell_toggled",
]);

const MAX_META_JSON = 4000;

/**
 * POST /api/bnhub/events — lightweight BNHub product events (no third-party SDK).
 */
export async function POST(request: Request) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "unknown";
  const rl = checkRateLimit(`bnhub:events:${ip}`, { windowMs: 60_000, max: 120 });
  if (!rl.allowed) {
    return Response.json(
      { ok: false, error: "Too many events." },
      { status: 429, headers: getRateLimitHeaders(rl) }
    );
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return Response.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  const eventName =
    typeof body.eventName === "string"
      ? body.eventName.trim()
      : typeof body.event_name === "string"
        ? body.event_name.trim()
        : "";
  if (!eventName || !ALLOWED.has(eventName)) {
    return Response.json({ ok: false, error: "Invalid or disallowed event name." }, { status: 400 });
  }

  let metadata: Record<string, unknown> | null = null;
  if (body.metadata != null && typeof body.metadata === "object" && !Array.isArray(body.metadata)) {
    try {
      const s = JSON.stringify(body.metadata);
      if (s.length > MAX_META_JSON) {
        return Response.json({ ok: false, error: "metadata too large." }, { status: 400 });
      }
      metadata = body.metadata as Record<string, unknown>;
    } catch {
      metadata = null;
    }
  }

  const result = await insertBnhubEvent({ event_name: eventName, metadata });
  if (!result.ok) {
    if (result.status >= 500) {
      logError("[bnhub] events insert failed", new Error(result.error));
    }
    return Response.json({ ok: false, error: result.error }, { status: result.status });
  }

  return Response.json({ ok: true }, { headers: getRateLimitHeaders(rl) });
}
