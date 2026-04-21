import type { Metadata } from "next";

import { ListingAssistantPage } from "@/components/lecipm-dashboard-mock/pages/ListingAssistantPage";

export const metadata: Metadata = {
  title: "LECIPM UI · Listing Assistant (mock)",
  robots: { index: false, follow: false },
};

export default function ListingAssistantMockPage() {
  return <ListingAssistantPage />;
}
