import { timingSafeEqual } from "node:crypto";
import type { NextRequest } from "next/server";

/**
 * Verifies internal cron / batch jobs using `Authorization: Bearer <CRON_SECRET>`.
 * Same contract as POST /api/internal/payouts/run.
 */
export function verifyCronBearer(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) return false;
  const auth = request.headers.get("authorization") ?? "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7).trim() : "";
  if (!token) return false;
  try {
    const a = Buffer.from(token, "utf8");
    const b = Buffer.from(secret, "utf8");
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

export function cronUnauthorized(): Response {
  return Response.json({ error: "Unauthorized" }, { status: 401 });
}

export function cronNotConfigured(): Response {
  return Response.json({ error: "Cron not configured" }, { status: 503 });
}
