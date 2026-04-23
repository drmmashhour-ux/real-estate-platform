import type { Metadata } from "next";

import { DisputesRoomPage } from "@/components/lecipm-dashboard-mock/pages/disputes";

export const metadata: Metadata = {
  title: "LECIPM UI · Dispute Room",
  robots: { index: false, follow: false },
};

export default function DesignDisputesPage() {
  return <DisputesRoomPage />;
}
