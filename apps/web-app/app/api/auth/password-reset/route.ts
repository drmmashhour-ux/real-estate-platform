import { NextRequest } from "next/server";

/**
 * POST /api/auth/password-reset — Request password reset (MVP stub).
 * In production: send email with reset link; validate token and set new password.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const email = typeof body?.email === "string" ? body.email.trim() : null;
    if (!email) {
      return Response.json({ error: "email required" }, { status: 400 });
    }
    // MVP: do not send email; return ok to avoid leaking existence of account
    return Response.json({
      ok: true,
      message: "If an account exists, a reset link would be sent. For MVP use demo-session or contact support.",
    });
  } catch {
    return Response.json({ error: "Request failed" }, { status: 500 });
  }
}
