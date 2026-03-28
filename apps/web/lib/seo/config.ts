import {
  PLATFORM_DEFAULT_DESCRIPTION,
  PLATFORM_DEFAULT_SITE_TITLE,
  PLATFORM_NAME,
} from "@/lib/brand/platform";
import { getSiteBaseUrl } from "@/modules/seo/lib/siteBaseUrl";

/**
 * Global SEO defaults for LECIPM + BNHub (metadata, sitemap, JSON-LD).
 */
export const seoConfig = {
  siteName: "LECIPM" as const,
  /** Canonical origin from env when set; otherwise same as {@link getSiteBaseUrl}. */
  get domain(): string {
    const raw = process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/$/, "");
    return raw && raw.length > 0 ? raw : getSiteBaseUrl();
  },
  defaultTitle: PLATFORM_DEFAULT_SITE_TITLE,
  defaultDescription: PLATFORM_DEFAULT_DESCRIPTION,
  brandName: PLATFORM_NAME,
} as const;
