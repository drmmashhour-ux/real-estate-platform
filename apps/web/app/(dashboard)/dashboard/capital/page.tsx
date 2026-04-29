import { CapitalDashboardClient } from "./CapitalDashboardClient";

export const metadata = {
  title: "Capital Allocator | LECIPM",
};

export default function CapitalDashboardPage() {
  return (
    <div className="mx-auto max-w-6xl p-6">
      <CapitalDashboardClient />
    </div>
  );
}
