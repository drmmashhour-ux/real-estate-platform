import type { Metadata } from "next";
import type { ReactNode } from "react";

import "@/components/soins/soins-hub.css";

import { SoinsHubHeader } from "@/components/soins/SoinsHubHeader";
import { buildPageMetadata } from "@/lib/seo/page-metadata";
import { seoConfig } from "@/lib/seo/config";
import { OG_DEFAULT_PLATFORM } from "@/lib/seo/og-defaults";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; country: string }>;
}): Promise<Metadata> {
  const { locale, country } = await params;
  return buildPageMetadata({
    title: `Soins Hub — Résidences & soins | ${seoConfig.siteName}`,
    description: `Explorez les résidences partenaires LECIPM — estimation claire, interface simple pour les familles.`,
    path: "/soins",
    locale,
    country,
    ogImage: OG_DEFAULT_PLATFORM,
    ogImageAlt: "LECIPM Soins Hub",
  });
}

export default async function SoinsHubSegmentLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string; country: string }>;
}) {
  const { locale, country } = await params;
  const hubBase = `/${locale}/${country}/soins`;

  return (
    <div className="min-h-screen bg-[#050505] text-[#FAFAF8] antialiased">
      <SoinsHubHeader locale={locale} country={country} hubBase={hubBase} showHomeLink />
      <main>{children}</main>
    </div>
  );
}
