import type { NextRequest } from "next/server";

/**
 * Best-effort client IP for rate limiting and logging (trust proxy headers when present).
 */
export function s2GetClientIp(req: Request | NextRequest): string {
  const h = (name: string) => {
    if ("headers" in req && req.headers) {
      return req.headers.get(name);
    }
    return null;
  };
  const forwarded = h("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  const realIp = h("x-real-ip");
  if (realIp?.trim()) return realIp.trim();
  const direct = (req as Request & { ip?: string }).ip;
  if (typeof direct === "string" && direct.length > 0) {
    return direct;
  }
  return "0";
}

export function s2RateLimitKey(ip: string, routeTag: string): string {
  return `${routeTag}|${ip}`;
}

/** For server actions: same IP heuristics as `s2GetClientIp` (trust x-forwarded-for first hop). */
export async function s2GetClientIpFromRequestHeaders(): Promise<string> {
  const { headers } = await import("next/headers");
  const h = await headers();
  const forwarded = h.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  const real = h.get("x-real-ip");
  if (real?.trim()) return real.trim();
  return "0";
}
