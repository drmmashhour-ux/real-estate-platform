/** Best-effort client IP / UA for audit logs (trust proxy headers only when deployed behind a known proxy). */
export function getRequestClientMeta(request: Request): { ipAddress: string; userAgent: string } {
  const fwd = request.headers.get("x-forwarded-for");
  const ipAddress = fwd?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown";
  const userAgent = request.headers.get("user-agent") || "unknown";
  return { ipAddress, userAgent };
}
