import type { Metadata } from "next";
import { DocumentsDashboardClient } from "./DocumentsDashboardClient";

export const metadata: Metadata = {
  title: "Documents — LECIPM",
  description: "Brokerage and investment document queue with approval gates.",
};

export default function DocumentsDashboardPage() {
  return <DocumentsDashboardClient />;
}
