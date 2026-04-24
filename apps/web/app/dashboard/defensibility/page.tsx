import { DefensibilityDashboardClient } from "./DefensibilityDashboardClient";

export const metadata = {
  title: "Defensibility Dashboard | LECIPM",
  description: "Visualizing the long-term competitive advantages and data moats of the LECIPM platform.",
};

export default function DefensibilityPage() {
  return (
    <div className="min-h-screen bg-black">
      <DefensibilityDashboardClient />
    </div>
  );
}
