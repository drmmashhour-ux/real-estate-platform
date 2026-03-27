import type { NextConfig } from "next";
import withPWAInit from "next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  skipWaiting: true,
  /** Avoid caching issues while iterating locally */
  scope: "/",
});

const isProd = process.env.NODE_ENV === "production" || process.env.VERCEL === "1";

const securityHeaders = [
  ...(isProd
    ? ([
        {
          key: "Strict-Transport-Security",
          value: "max-age=31536000; includeSubDomains",
        },
      ] as const)
    : []),
  { key: "X-DNS-Prefetch-Control", value: "on" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

const nextConfig: NextConfig = {
  transpilePackages: ["@lecipm/ui", "@lecipm/api-client"],
  reactStrictMode: true,
  /** PDF rendering uses Node-only deps; keep them external for App Router API routes. */
  serverExternalPackages: ["@react-pdf/renderer", "nspell"],
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default withPWA(nextConfig);
