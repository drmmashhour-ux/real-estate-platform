import { InvestorDashboardClient } from "./InvestorDashboardClient";

export const metadata = {
  title: "Fundraising Pipeline | Admin",
  description: "Manage investor relationships and capital raising.",
};

export default function InvestorDashboardPage() {
  return <InvestorDashboardClient />;
}
