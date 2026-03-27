import { NextRequest, NextResponse } from "next/server";
import { isDemoAuthAllowed } from "@/lib/auth/demo-auth-allowed";
import { checkRateLimit, getRateLimitHeaders } from "@/lib/rate-limit";

/**
 * POST /api/auth/password-reset — Request password reset (MVP stub).
 * In production: send email with reset link; validate token and set new password.
 */
export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? request.headers.get("x-real-ip") ?? "anonymous";
    const limit = checkRateLimit(`auth:password-reset:${ip}`, { windowMs: 60_000, max: 12 });
    if (!limit.allowed) {
      return NextResponse.json({ error: "Too many requests. Try again later." }, { status: 429, headers: getRateLimitHeaders(limit) });
    }
    const body = await request.json();
    const email = typeof body?.email === "string" ? body.email.trim() : null;
    if (!email) {
      return Response.json({ error: "email required" }, { status: 400 });
    }
    // MVP: do not send email; return ok to avoid leaking existence of account
    const tail = isDemoAuthAllowed()
      ? " For local development, BNHub demo sign-in may be available."
      : " Contact support if you need access.";
    return Response.json({
      ok: true,
      message: `If an account exists, a reset link would be sent.${tail}`,
    });
  } catch {
    return Response.json({ error: "Request failed" }, { status: 500 });
  }
}
