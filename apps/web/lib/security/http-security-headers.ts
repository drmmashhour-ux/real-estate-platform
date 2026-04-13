export type HttpSecurityHeader = { key: string; value: string };

/**
 * Headers applied globally via next.config `headers()`.
 * Kept in one module for tests and docs parity (see docs/security/PROD-SECURITY-CHECKLIST.md).
 */
export function buildHttpSecurityHeaders(opts: {
  isProductionLike: boolean;
}): HttpSecurityHeader[] {
  return [
    ...(opts.isProductionLike
      ? ([
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains",
          },
        ] as const)
      : []),
    { key: "X-DNS-Prefetch-Control", value: "on" },
    { key: "X-Frame-Options", value: "SAMEORIGIN" },
    /** Explicitly disable legacy XSS auditor (deprecated; CSP + encoding are the real fix). */
    { key: "X-XSS-Protection", value: "0" },
    { key: "X-Content-Type-Options", value: "nosniff" },
    { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
    { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
    {
      key: "Content-Security-Policy",
      value: "frame-ancestors 'self'",
    },
  ];
}
