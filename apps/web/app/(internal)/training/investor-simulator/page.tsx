import type { Metadata } from "next";
import { InvestorSimulator } from "@/components/training/InvestorSimulator";

export const metadata: Metadata = {
  title: "Investor simulator (internal)",
  robots: { index: false, follow: false },
};

export default function InvestorSimulatorTrainingPage() {
  return (
    <main className="min-h-screen bg-[#0B0B0B] px-4 py-10 sm:px-6">
      <InvestorSimulator />
    </main>
  );
}
