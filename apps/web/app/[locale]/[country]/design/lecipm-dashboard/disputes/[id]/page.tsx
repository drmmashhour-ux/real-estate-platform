import type { Metadata } from "next";

import { DisputeDetailPage } from "@/components/lecipm-dashboard-mock/pages/DisputeDetailPage";

export const metadata: Metadata = {
  title: "LECIPM UI · Dispute detail",
  robots: { index: false, follow: false },
};

export default async function DesignDisputeDetailRoute(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  return <DisputeDetailPage disputeId={id} />;
}
