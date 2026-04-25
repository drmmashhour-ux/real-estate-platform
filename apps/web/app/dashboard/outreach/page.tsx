import { Metadata } from "next";
import { OutreachDashboardClient } from "./OutreachDashboardClient";

export const metadata: Metadata = {
  title: "Outreach Hub | LECIPM",
  description: "Acquire your first 20 brokers.",
};

export default function OutreachDashboardPage() {
  return (
    <div className="min-h-screen bg-black">
      <OutreachDashboardClient />
    </div>
  );
}
