import { redirect } from "next/navigation";
import { DEFAULT_COUNTRY_SLUG } from "@/config/countries";
import { routing } from "@/i18n/routing";

/**
 * Short public URL → canonical localized broker profile.
 */
export default async function BrokerPublicShortLinkPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/${routing.defaultLocale}/${DEFAULT_COUNTRY_SLUG}/broker/${encodeURIComponent(id)}`);
}
