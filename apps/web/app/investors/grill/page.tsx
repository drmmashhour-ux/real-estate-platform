import { InvestorGrillLiveClient } from "./InvestorGrillLiveClient";

export const metadata = {
  title: "InvestorGrillLive — LECIPM",
  description:
    "Simulate a live investor meeting: pressure, timers, and heuristic feedback. Training only, not legal or investment advice.",
};

export default function InvestorGrillPage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="border-b border-zinc-800 bg-zinc-900/40 px-4 py-2 text-center text-[11px] text-zinc-500">
        InvestorGrillLive — training tool; not legal, tax, or investment advice. In diligence, use verified data and
        professional counsel.
      </div>
      <InvestorGrillLiveClient />
    </div>
  );
}
