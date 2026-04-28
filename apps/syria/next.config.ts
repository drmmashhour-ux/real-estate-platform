import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import bundleAnalyzer from "@next/bundle-analyzer";
import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

/** ORDER SYBNB-91 — `pnpm analyze` sets `ANALYZE=true` to inspect client/server bundles. */
const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
});

/** Monorepo: load repo-root .env if present so `DATABASE_URL` works without copying into apps/syria. */
function mergeMonorepoRootEnv() {
  const root = join(process.cwd(), "../..");
  for (const file of [".env.local", ".env"] as const) {
    const p = join(root, file);
    if (!existsSync(p)) continue;
    for (const line of readFileSync(p, "utf8").split("\n")) {
      const t = line.trim();
      if (!t || t.startsWith("#")) continue;
      const eq = t.indexOf("=");
      if (eq <= 0) continue;
      const key = t.slice(0, eq).trim();
      if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(key)) continue;
      let val = t.slice(eq + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      if (process.env[key] === undefined) {
        process.env[key] = val;
      }
    }
  }
}
mergeMonorepoRootEnv();

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

/** ORDER SYBNB-86 / SYBNB-90 / SYBNB-91 — compress, images, bundle analysis wrapper. */
const nextConfig: NextConfig = {
  transpilePackages: ["@repo/drbrain", "@repo/offline"],
  reactStrictMode: true,
  compress: true,
  poweredByHeader: false,
  /**
   * ORDER SYBNB-82 — Immutable hashed assets served from CDN / edge with long TTL.
   * Listing HTML stays dynamic; DB-backed fragments use `unstable_cache` + route `revalidate`.
   */
  async headers() {
    return [
      {
        source: "/_next/static/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
    ];
  },
  images: {
    /** ORDER SYBNB-90 — AVIF/WebP when supported; Cloudinary `f_auto` delivery pairs with this. */
    formats: ["image/avif", "image/webp"],
    qualities: [40, 50, 60, 75, 100],
    minimumCacheTTL: 86_400,
    /** Cloudinary host — placeholder `/YOUR_CLOUD_NAME/` is not a path segment; match whole CDN tree. */
    remotePatterns: [{ protocol: "https", hostname: "res.cloudinary.com", pathname: "/**" }],
  },
  /** JSON bodies stay small once photos use CDN URLs (SYBNB-87); large payloads remain for other Server Actions. */
  experimental: {
    serverActions: {
      bodySizeLimit: "12mb",
    },
  },
};

/** `@next/bundle-analyzer` peers Next 14 typings — silence cross-version `NextConfig` mismatch in this monorepo. */
const syriaNextConfig = withNextIntl(nextConfig as any) as any;
export default withBundleAnalyzer(syriaNextConfig);
