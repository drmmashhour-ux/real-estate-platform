import type { Metadata } from "next";
import { PortfolioPlannerClient } from "./PortfolioPlannerClient";

export const metadata: Metadata = {
  title: "Investor portfolio planner",
  description: "Goal-based portfolio scenarios — estimates only, not financial advice.",
};

export default function InvestPortfolioPage() {
  return (
    <main className="min-h-screen bg-[#0B0B0B] text-white">
      <PortfolioPlannerClient />
    </main>
  );
}
