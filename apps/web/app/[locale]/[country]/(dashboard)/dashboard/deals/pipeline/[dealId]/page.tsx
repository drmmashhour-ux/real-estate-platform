import { redirect } from "next/navigation";

/** Canonical route is `/dashboard/deals/[dealId]` — keep legacy path working. */
export default async function PipelineDealDetailLegacyRedirect({
  params,
}: {
  params: Promise<{ locale: string; country: string; dealId: string }>;
}) {
  const { locale, country, dealId } = await params;
  redirect(`/${locale}/${country}/dashboard/deals/${dealId}`);
}
