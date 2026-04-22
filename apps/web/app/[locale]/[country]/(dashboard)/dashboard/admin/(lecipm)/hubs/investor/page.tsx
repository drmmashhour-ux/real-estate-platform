import { HubAdminDetailPage } from "../_hub-detail-page";

export const dynamic = "force-dynamic";

export default async function AdminHubInvestorPage({
  params,
}: {
  params: Promise<{ locale: string; country: string }>;
}) {
  return HubAdminDetailPage({ params, hub: "investor", hubTitle: "Investor Hub" });
}
