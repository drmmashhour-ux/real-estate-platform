import { buildPageMetadata } from "@/lib/seo/page-metadata";
import { SeniorGuidedFlow } from "@/modules/senior-living/ui/senior-guided-flow";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; country: string }>;
}) {
  const { locale, country } = await params;
  return buildPageMetadata({
    title: "Step-by-step help — Senior Living | LECIPM",
    description: "Answer a few simple questions. We suggest places that may fit — not medical advice.",
    path: "/senior-living/guide",
    locale,
    country,
  });
}

export default async function SeniorGuidePage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; country: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale, country } = await params;
  const sp = await searchParams;
  const ab = typeof sp.sl_ab === "string" ? sp.sl_ab.trim() : "";
  const voiceFirst = ab === "voice";
  return <SeniorGuidedFlow locale={locale} country={country} voiceFirst={voiceFirst} />;
}
