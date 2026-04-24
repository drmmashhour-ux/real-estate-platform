import { HubAdminDetailPage } from "../_hub-detail-page";

export const dynamic = "force-dynamic";

export default async function AdminHubSellerPage({
  params,
}: {
  params: Promise<{ locale: string; country: string }>;
}) {
  return HubAdminDetailPage({ params, hub: "seller", hubTitle: "Seller Hub" });
}
