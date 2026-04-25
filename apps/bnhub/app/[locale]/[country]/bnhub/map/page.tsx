import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { buildPageMetadata } from "@/lib/seo/page-metadata";
import { seoConfig } from "@/lib/seo/config";
import { OG_DEFAULT_BNHUB } from "@/lib/seo/og-defaults";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; country: string }>;
}): Promise<Metadata> {
  const { locale, country } = await params;
  return buildPageMetadata({
    title: `Map — BNHUB | ${seoConfig.siteName}`,
    description: `Explore short-term stays on the map — pins, prices, and instant booking on ${seoConfig.siteName}.`,
    path: "/bnhub/map",
    locale,
    country,
    ogImage: OG_DEFAULT_BNHUB,
    ogImageAlt: "BNHUB map search",
  });
}

/** Map-first discovery — full search UI with map layout (pins, price labels, card flow). */
export default async function BnhubMapPage({
  searchParams,
}: {
  searchParams?: Promise<{ city?: string }>;
}) {
  const sp = searchParams ? await searchParams : {};
  const p = new URLSearchParams();
  p.set("mapLayout", "map");
  if (sp.city?.trim()) {
    p.set("city", sp.city.trim());
  }
  redirect(`/bnhub/stays?${p.toString()}`);
}
