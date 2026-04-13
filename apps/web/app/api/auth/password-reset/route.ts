import { NextRequest, NextResponse } from "next/server";
import { isDemoAuthAllowed } from "@/lib/auth/demo-auth-allowed";
import { gateDistributedRateLimit } from "@/lib/rate-limit-enforcement";

/**
 * POST /api/auth/password-reset — Request password reset (MVP stub).
 * In production: send email with reset link; validate token and set new password.
 */
export async function POST(request: NextRequest) {
  try {
    const gate = await gateDistributedRateLimit(request, "auth:password-reset", { windowMs: 60_000, max: 12 });
    if (!gate.allowed) return gate.response;
    const body = await request.json();
    const email = typeof body?.email === "string" ? body.email.trim() : null;
    if (!email) {
      return Response.json({ error: "email required" }, { status: 400 });
    }
    // MVP: do not send email; return ok to avoid leaking existence of account
    const tail = isDemoAuthAllowed()
      ? " For local development, BNHUB demo sign-in may be available."
      : " Contact support if you need access.";
    return Response.json({
      ok: true,
      message: `If an account exists, a reset link would be sent.${tail}`,
    });
  } catch {
    return Response.json({ error: "Request failed" }, { status: 500 });
  }
}
