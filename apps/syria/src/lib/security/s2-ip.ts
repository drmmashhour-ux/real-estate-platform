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
  const nreq = req as NextRequest;
  if (nreq && typeof nreq.ip === "string" && nreq.ip.length > 0) {
    return nreq.ip;
  }
  return "0";
}

export function s2RateLimitKey(ip: string, routeTag: string): string {
  return `${routeTag}|${ip}`;
}
