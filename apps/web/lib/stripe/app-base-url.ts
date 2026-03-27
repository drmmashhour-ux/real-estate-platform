import type { NextRequest } from "next/server";

/** Public origin for Stripe return/refresh URLs (must be absolute). */
export function stripeAppBaseUrl(request: NextRequest): string {
  const fromEnv = process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/$/, "");
  if (fromEnv) return fromEnv;
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  const proto = request.headers.get("x-forwarded-proto") ?? "http";
  if (host) return `${proto}://${host}`;
  return "http://localhost:3000";
}
