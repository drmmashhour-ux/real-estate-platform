import { Metadata } from "next";
import { MarketDashboardClient } from "./MarketDashboardClient";

export const metadata: Metadata = {
  title: "Market Domination | LECIPM",
  description: "Geographic expansion and city-level performance tracking.",
};

export default function MarketDashboardPage() {
  return (
    <div className="min-h-screen bg-black">
      <MarketDashboardClient />
    </div>
  );
}
