import type { Metadata } from "next";

import { ListingsPlaceholder } from "@/components/lecipm-dashboard-mock/pages/ListingsPlaceholder";

export const metadata: Metadata = {
  title: "LECIPM UI · Listings (mock)",
  robots: { index: false, follow: false },
};

export default function ListingsMockPage() {
  return <ListingsPlaceholder />;
}
