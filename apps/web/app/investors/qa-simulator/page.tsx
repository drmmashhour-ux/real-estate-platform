import { InvestorQaSimulatorClient } from "./InvestorQaSimulatorClient";

export const metadata = {
  title: "Investor Q&A practice | LECIPM",
  description: "Simulate tough investor questions; heuristic feedback and model answers. Training only, not legal or investment advice.",
};

export default function InvestorQaSimulatorPage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="border-b border-zinc-800 bg-zinc-900/40 px-4 py-2 text-center text-[11px] text-zinc-500">
        Training tool — not investment, legal, or regulatory advice. Replace examples with your verified facts in live diligence.
      </div>
      <InvestorQaSimulatorClient />
    </div>
  );
}
