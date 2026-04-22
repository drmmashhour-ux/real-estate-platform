import { HubAdminDetailPage } from "../_hub-detail-page";

export const dynamic = "force-dynamic";

export default async function AdminHubBrokerPage({
  params,
}: {
  params: Promise<{ locale: string; country: string }>;
}) {
  return HubAdminDetailPage({ params, hub: "broker", hubTitle: "Broker Hub" });
}
