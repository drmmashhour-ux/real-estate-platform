import { HubAdminDetailPage } from "../_hub-detail-page";

export const dynamic = "force-dynamic";

export default async function AdminHubRentPage({
  params,
}: {
  params: Promise<{ locale: string; country: string }>;
}) {
  return HubAdminDetailPage({ params, hub: "rent", hubTitle: "Rent Hub" });
}
