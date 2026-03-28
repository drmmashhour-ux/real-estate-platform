import type { MetadataRoute } from "next";
import { seoConfig } from "@/lib/seo/config";

export default function robots(): MetadataRoute.Robots {
  if (process.env.NEXT_PUBLIC_ENV === "staging") {
    return {
      rules: { userAgent: "*", disallow: ["/"] },
    };
  }
  return {
    rules: {
      userAgent: "*",
      allow: ["/"],
      disallow: [
        "/admin/",
        "/dashboard/",
        "/api/",
        "/auth/",
        "/host/",
        "/guest/",
        "/workspaces/",
        "/demo/",
        "/embed/",
        "/internal/",
        "/checkout/",
        "/client-documents/",
      ],
    },
    sitemap: `${seoConfig.domain}/sitemap.xml`,
  };
}
