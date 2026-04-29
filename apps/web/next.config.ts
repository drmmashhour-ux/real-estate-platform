import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";
import withPWAInit from "next-pwa";
import { buildHttpSecurityHeaders } from "./lib/security/http-security-headers";

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

const withPWA = withPWAInit({
  dest: "public",
  /** TEMP: disable service worker so old builds are not served from cache; re-enable after verification. */
  disable: true,
  register: true,
  skipWaiting: true,
  /** Avoid caching issues while iterating locally */
  scope: "/",
});

const isProd = process.env.NODE_ENV === "production" || process.env.VERCEL === "1";

const disableWebpackPersistentCache =
  process.env.NEXT_DISABLE_WEBPACK_CACHE === "1" ||
  process.env.DISABLE_WEBPACK_DISK_CACHE === "1" ||
  process.env.CI === "true";

const securityHeaders = buildHttpSecurityHeaders({ isProductionLike: isProd });

/** TEMP: strip edge/browser caching so fresh middleware/HTML is served after deploy. Remove after verification (hurts `_next/static` CDN caching). */
const forceNoStoreDocumentCache = [
  { key: "Cache-Control", value: "no-store, no-cache, must-revalidate" },
] as const;

const nextConfig: NextConfig = {
  /**
   * Phase 1: Next 16 no longer honors `swcMinify`; webpack `optimization.minimize` is toggled below to surface
   * real compile errors when minifier plugins misbehave (`WebpackError is not a constructor`).
   */
  experimental: {
    /** Narrow parallelism for reproducible/stable CI/webpack behavior */
    cpus: 1,
    workerThreads: false,
  },
  /** Next.js 16 defaults to Turbopack; `next-pwa` injects webpack config — empty Turbopack block opts in explicitly. */
  turbopack: {},
  transpilePackages: [
    "@repo/drbrain",
    "@repo/offline",
    "@repo/tenant",
    "@lecipm/ui",
    "@lecipm/api",
    "@lecipm/api-client",
    "@lecipm/core",
    "@lecipm/platform-core",
    "mapbox-gl",
    "react-map-gl",
    "@vis.gl/react-mapbox",
  ],
  reactStrictMode: true,
  // instrumentationHook: true, // This is often the culprit
  images: {
    remotePatterns: [{ protocol: "https", hostname: "images.unsplash.com", pathname: "/**" }],
  },
  /** PDF rendering uses Node-only deps; keep them external for App Router API routes. */
  serverExternalPackages: [
    "@prisma/client",
    "@prisma/client-runtime-utils",
    "@repo/db",
    "@repo/db-marketplace",
    "@repo/db-listings",
    "@repo/db-core",
    "@repo/db-auth",
    "@react-pdf/renderer",
    "nspell",
  ],
  /** Short SEO landing URLs → default locale/country growth-seo pages (indexable). */
  async rewrites() {
    const L = "/en/ca";
    return [
      /** LECIPM console lead APIs — legacy `/api/leads` → canonical `/api/lecipm/leads` (POST body preserved). */
      { source: "/api/leads", destination: "/api/lecipm/leads" },
      { source: "/api/leads/:path*", destination: "/api/lecipm/leads/:path*" },
      { source: "/broker-software-quebec", destination: `${L}/growth-seo/broker-software-quebec` },
      { source: "/real-estate-crm-ai", destination: `${L}/growth-seo/real-estate-crm-ai` },
      { source: "/tenant-screening-canada", destination: `${L}/growth-seo/tenant-screening-canada` },
      { source: "/esg-real-estate-platform", destination: `${L}/growth-seo/esg-real-estate-platform` },
    ];
  },
  /** Legacy admin URLs from docs / bookmarks → real App Router pages. */
  async redirects() {
    const L = "/en/ca";
    return [
      { source: "/admin/payments", destination: `${L}/admin/payments`, permanent: false },
      { source: "/admin/settings", destination: `${L}/admin/controls`, permanent: false },
      { source: "/admin/settings/:path*", destination: `${L}/admin/controls`, permanent: false },
      /** Legacy / marketing URLs → current App Router paths (E2E + bookmarks). */
      { source: "/map-search", destination: `${L}/bnhub/stays`, permanent: false },
      { source: "/property/:id", destination: `${L}/listings/:id`, permanent: false },
      { source: "/broker-dashboard", destination: `${L}/broker/dashboard`, permanent: false },
      { source: "/favorites", destination: `${L}/projects`, permanent: false },
      { source: "/saved-searches", destination: `${L}/projects`, permanent: false },
    ];
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [...securityHeaders, ...forceNoStoreDocumentCache],
      },
    ];
  },

  /**
   * Avoid webpack’s PackFileCacheStrategy disk cache when builders are low on space (ENOSPC).
   * Enable with `NEXT_DISABLE_WEBPACK_CACHE=1` or `CI=true` — slightly slower compile, same output.
   */
  webpack: (config, { dev, isServer }) => {
    if (!dev) {
      /** Default off: minifier bugs mask real compile errors; set `NEXT_WEBPACK_MINIMIZE=1` for production-sized outputs. */
      const enableMinify = process.env.NEXT_WEBPACK_MINIMIZE === "1";
      config.optimization = config.optimization ?? {};
      config.optimization.minimize = enableMinify;
    }
    if (!isServer) {
      config.resolve = config.resolve ?? {};
      config.resolve.fallback = {
        ...(config.resolve.fallback ?? {}),
        fs: false,
        net: false,
        tls: false,
      };
    }
    if (!dev && disableWebpackPersistentCache) {
      config.cache = false;
    }
    return config;
  },
};

export default withNextIntl(withPWA(nextConfig));
