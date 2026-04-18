import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

/** @deprecated Use `/admin/brokers-acquisition` (V1 pipeline). */
export default async function AdminBrokerPipelineRedirectPage({
  params,
}: {
  params: Promise<{ locale: string; country: string }>;
}) {
  const { locale, country } = await params;
  redirect(`/${locale}/${country}/admin/brokers-acquisition`);
}
