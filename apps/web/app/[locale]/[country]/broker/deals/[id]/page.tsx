import { redirect } from "next/navigation";

/** Alias: `/broker/deals/[id]` → residential Québec brokerage deal workspace. */
export default async function BrokerDealsIdAliasPage({
  params,
}: {
  params: Promise<{ locale: string; country: string; id: string }>;
}) {
  const { locale, country, id } = await params;
  redirect(`/${locale}/${country}/broker/residential/deals/${id}`);
}
