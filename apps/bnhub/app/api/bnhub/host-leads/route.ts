import { checkRateLimit, getRateLimitHeaders } from "@/lib/rate-limit";
import { insertBnhubHostLead } from "@/lib/bnhub/growth-supabase";
import { logError } from "@/lib/logger";

export const dynamic = "force-dynamic";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * POST /api/bnhub/host-leads — early host / supply interest (not full onboarding).
 */
export async function POST(request: Request) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "unknown";
  const rl = checkRateLimit(`bnhub:host-leads:${ip}`, { windowMs: 86_400_000, max: 10 });
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

  const name = typeof body.name === "string" ? body.name.trim().slice(0, 200) : "";
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase().slice(0, 320) : "";
  if (!name || name.length < 2) {
    return Response.json({ ok: false, error: "name is required." }, { status: 400 });
  }
  if (!email || !EMAIL_RE.test(email)) {
    return Response.json({ ok: false, error: "Valid email is required." }, { status: 400 });
  }

  const propertyType =
    typeof body.propertyType === "string"
      ? body.propertyType.trim().slice(0, 120)
      : typeof body.property_type === "string"
        ? body.property_type.trim().slice(0, 120)
        : null;
  const location =
    typeof body.location === "string" ? body.location.trim().slice(0, 200) : null;

  const result = await insertBnhubHostLead({
    name,
    email,
    property_type: propertyType,
    location,
  });

  if (!result.ok) {
    if (result.status >= 500) {
      logError("[bnhub] host-leads insert failed", new Error(result.error));
    }
    return Response.json({ ok: false, error: result.error }, { status: result.status });
  }

  return Response.json({ ok: true }, { headers: getRateLimitHeaders(rl) });
}
