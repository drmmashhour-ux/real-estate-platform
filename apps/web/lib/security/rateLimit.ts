/**
 * In-memory fixed-window rate limiter (per Node process).
 * For multi-instance production, prefer Redis / edge rate limits; this still blocks casual abuse on a single host.
 */
type Entry = { count: number; time: number };

const globalForLimit = globalThis as unknown as { __rateLimitMap?: Map<string, Entry> };

const requests = globalForLimit.__rateLimitMap ?? new Map<string, Entry>();
if (process.env.NODE_ENV !== "production") {
  globalForLimit.__rateLimitMap = requests;
}

export function rateLimit(ip: string, limit = 50, windowMs = 60000): boolean {
  const now = Date.now();

  if (!requests.has(ip)) {
    requests.set(ip, { count: 1, time: now });
    return true;
  }

  const entry = requests.get(ip)!;

  if (now - entry.time > windowMs) {
    requests.set(ip, { count: 1, time: now });
    return true;
  }

  if (entry.count >= limit) {
    return false;
  }

  entry.count++;
  return true;
}

/** Best-effort client IP from reverse proxy headers (Vercel, nginx, etc.). */
export function getClientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  const real = req.headers.get("x-real-ip")?.trim();
  if (real) return real;
  return "unknown";
}
