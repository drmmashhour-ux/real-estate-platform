import { checkRateLimit, getRateLimitHeaders } from "@/lib/rate-limit";
import { insertBnhubFeedback } from "@/lib/bnhub/growth-supabase";
import { logError } from "@/lib/logger";

export const dynamic = "force-dynamic";

const MAX_MSG = 4000;
const MAX_EMAIL = 320;
const MAX_SCREEN = 200;

/**
 * POST /api/bnhub/feedback — BNHub app feedback (message + optional email/context).
 */
export async function POST(request: Request) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "unknown";
  const rl = checkRateLimit(`bnhub:feedback:${ip}`, { windowMs: 86_400_000, max: 15 });
  if (!rl.allowed) {
    return Response.json(
      { ok: false, error: "Too many submissions." },
      { status: 429, headers: getRateLimitHeaders(rl) }
    );
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return Response.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  const message = typeof body.message === "string" ? body.message.trim() : "";
  if (!message || message.length > MAX_MSG) {
    return Response.json({ ok: false, error: "message is required (max 4000 chars)." }, { status: 400 });
  }

  const email =
    typeof body.email === "string" && body.email.trim() ? body.email.trim().slice(0, MAX_EMAIL) : null;
  const screen = typeof body.screen === "string" ? body.screen.trim().slice(0, MAX_SCREEN) : null;
  const bookingId =
    typeof body.bookingId === "string" && body.bookingId.trim()
      ? body.bookingId.trim().slice(0, 64)
      : typeof body.booking_id === "string" && body.booking_id.trim()
        ? body.booking_id.trim().slice(0, 64)
        : null;

  const result = await insertBnhubFeedback({
    message,
    email,
    screen,
    booking_id: bookingId,
  });

  if (!result.ok) {
    if (result.status >= 500) {
      logError("[bnhub] feedback insert failed", new Error(result.error));
    }
    return Response.json({ ok: false, error: result.error }, { status: result.status });
  }

  return Response.json({ ok: true }, { headers: getRateLimitHeaders(rl) });
}
