import type { MetadataRoute } from "next";
import { getSiteBaseUrl } from "@/modules/seo/lib/siteBaseUrl";

export default function robots(): MetadataRoute.Robots {
  if (process.env.NEXT_PUBLIC_ENV === "staging") {
    return {
      rules: { userAgent: "*", disallow: ["/"] },
    };
  }
  const base = getSiteBaseUrl();
  return {
    rules: { userAgent: "*", allow: ["/"] },
    sitemap: `${base}/sitemap.xml`,
  };
}
