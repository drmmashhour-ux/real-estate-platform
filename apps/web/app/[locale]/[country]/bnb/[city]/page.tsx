import { permanentRedirect, notFound } from "next/navigation";
import { parseGrowthCitySlugParam } from "@/lib/growth/geo-slugs";

type Props = { params: Promise<{ city: string }> };

/** SEO alias: `/bnb/[city]` → BNHUB stays search. */
export default async function BnbCityAliasPage({ params }: Props) {
  const { city } = await params;
  const slug = parseGrowthCitySlugParam(city);
  if (!slug) notFound();
  permanentRedirect(`/bnhub/stays?city=${encodeURIComponent(slug)}`);
}
