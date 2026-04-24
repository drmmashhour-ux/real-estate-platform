import { RolloutDashboardClient } from "./RolloutDashboardClient";

export const metadata = {
  title: "Policy Rollouts | Admin",
  description: "Progressive policy deployment and safety monitoring.",
};

export default function RolloutDashboardPage() {
  return <RolloutDashboardClient />;
}
